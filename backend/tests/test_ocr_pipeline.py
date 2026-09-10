import pytest
import uuid
import os
from unittest.mock import patch, MagicMock, AsyncMock
from PIL import Image

from app.services.document.image_processor import ImageProcessor
from app.services.providers.ocr_base import OCRResult, OCRRegion
from app.core.exceptions import BaseLingoraException
from app.tasks.document_tasks import run_document_pipeline_async
from app.models.domain import TranslationJob, JobStatus, File as FileModel

class MockImage:
    def __init__(self, format="PNG"):
        self.format = format
    def close(self):
        pass

@pytest.fixture
def mock_image_open():
    with patch("PIL.Image.open") as mock_open:
        mock_open.return_value = MockImage()
        yield mock_open

@pytest.fixture
def mock_ocr_provider():
    provider = MagicMock()
    provider.extract_text.return_value = OCRResult(
        full_text="Sample extracted text",
        regions=[OCRRegion(text="Sample extracted text", left=0, top=0, width=10, height=10)]
    )
    return provider

@pytest.fixture
def image_processor(mock_ocr_provider):
    return ImageProcessor(ocr_provider=mock_ocr_provider)

def test_valid_image_processor(image_processor, mock_image_open, tmp_path):
    img_path = tmp_path / "test.png"
    img_path.write_text("fake image data")
    
    # 1. Valid PNG (represented by fake file creation)
    chunks = image_processor.extract_text(str(img_path))
    assert len(chunks) == 1
    assert chunks[0] == "Sample extracted text"

def test_valid_jpg_processor(image_processor, mock_image_open, tmp_path):
    img_path = tmp_path / "test.jpg"
    img_path.write_text("fake image data")
    
    # 2. Valid JPG
    chunks = image_processor.extract_text(str(img_path))
    assert len(chunks) == 1
    assert chunks[0] == "Sample extracted text"

def test_unsupported_image(image_processor, tmp_path):
    img_path = tmp_path / "test.xyz"
    img_path.write_text("fake image data")
    
    # Although factory checks extension, ImageProcessor.validate doesn't check extension, 
    # it just checks if it exists and size.
    # To truly test unsupported, we'll mock Image.open to throw an error like PIL does for unknown formats.
    with patch("PIL.Image.open", side_effect=Exception("Unknown image format")):
        with pytest.raises(BaseLingoraException, match="Failed to process image OCR"):
            image_processor.extract_text(str(img_path))

def test_empty_no_text_image(image_processor, mock_image_open, tmp_path, mock_ocr_provider):
    img_path = tmp_path / "empty.png"
    img_path.write_text("fake image data")
    
    # 4. Empty/no-text image
    mock_ocr_provider.extract_text.return_value = OCRResult(full_text="   \n   ", regions=[])
    
    chunks = image_processor.extract_text(str(img_path))
    assert len(chunks) == 0

def test_ocr_provider_failure(image_processor, mock_image_open, tmp_path, mock_ocr_provider):
    img_path = tmp_path / "fail.png"
    img_path.write_text("fake image data")
    
    # 5. OCR provider failure
    mock_ocr_provider.extract_text.side_effect = Exception("Tesseract crashed")
    
    with pytest.raises(BaseLingoraException, match="Failed to process image OCR: Tesseract crashed"):
        image_processor.extract_text(str(img_path))

@pytest.mark.asyncio
@patch("app.tasks.document_tasks.SessionLocal")
@patch("app.tasks.document_tasks.translation_service")
@patch("app.tasks.document_tasks.DocumentProcessorFactory")
async def test_successful_ocr_and_translation(mock_factory, mock_ts, mock_session_local, db_session, test_user, tmp_path):
    # Prevent the task from closing our test session
    original_close = db_session.close
    db_session.close = lambda: None
    mock_session_local.return_value = db_session
    
    # Setup database file and job
    job_id = uuid.uuid4()
    file_id = uuid.uuid4()
    
    db_file = FileModel(id=file_id, filename="test.png", file_type="image/png", storage_path=str(tmp_path / "test.png"))
    db_session.add(db_file)
    
    db_job = TranslationJob(id=job_id, user_id=test_user.id, file_id=file_id, source_language="en", target_language="fr", status=JobStatus.PENDING)
    db_session.add(db_job)
    db_session.commit()
    
    # Setup mocks
    mock_processor = MagicMock()
    mock_processor.extract_text.return_value = ["Sample text"]
    mock_processor.generate_translated_file.return_value = str(tmp_path / "translated.txt")
    
    (tmp_path / "translated.txt").write_text("Texte traduit")
    
    mock_factory.get_processor.return_value = mock_processor
    
    mock_ts.translate_text = AsyncMock(return_value=("Texte traduit", "AI Translated"))
    
    # 7. Successful OCR + translation
    await run_document_pipeline_async(job_id, file_id, "en", "fr", test_user.id)
    
    # Verify result
    db_job = db_session.query(TranslationJob).filter_by(id=job_id).first()
    assert db_job.status == JobStatus.COMPLETED
    assert db_job.progress == 100
    assert db_job.result is not None
    assert db_job.result.original_transcript == "Sample text"
    assert db_job.result.result_text == "Texte traduit"
    assert db_job.result.translation_source == "AI Translated"

@pytest.mark.asyncio
@patch("app.tasks.document_tasks.SessionLocal")
@patch("app.tasks.document_tasks.translation_service")
@patch("app.tasks.document_tasks.DocumentProcessorFactory")
async def test_translation_provider_failure(mock_factory, mock_ts, mock_session_local, db_session, test_user, tmp_path):
    original_close = db_session.close
    db_session.close = lambda: None
    mock_session_local.return_value = db_session
    job_id = uuid.uuid4()
    file_id = uuid.uuid4()
    
    db_file = FileModel(id=file_id, filename="test.png", file_type="image/png", storage_path=str(tmp_path / "test.png"))
    db_session.add(db_file)
    
    db_job = TranslationJob(id=job_id, user_id=test_user.id, file_id=file_id, source_language="en", target_language="fr", status=JobStatus.PENDING)
    db_session.add(db_job)
    db_session.commit()
    
    mock_processor = MagicMock()
    mock_processor.extract_text.return_value = ["Sample text"]
    mock_processor.generate_translated_file.return_value = str(tmp_path / "translated.txt")
    mock_factory.get_processor.return_value = mock_processor
    
    # 6. Translation provider failure
    mock_ts.translate_text = AsyncMock(side_effect=Exception("DeepL API limits exceeded"))
    
    with pytest.raises(Exception, match="DeepL API limits exceeded"):
        await run_document_pipeline_async(job_id, file_id, "en", "fr", test_user.id)
        
    db_job = db_session.query(TranslationJob).filter_by(id=job_id).first()
    assert db_job.status == JobStatus.FAILED
    assert "DeepL API limits exceeded" in db_job.error_message

@pytest.mark.asyncio
@patch("app.tasks.document_tasks.SessionLocal")
@patch("app.tasks.document_tasks.translation_service")
@patch("app.tasks.document_tasks.DocumentProcessorFactory")
async def test_job_status_transitions(mock_factory, mock_ts, mock_session_local, db_session, test_user, tmp_path):
    original_close = db_session.close
    db_session.close = lambda: None
    mock_session_local.return_value = db_session
    job_id = uuid.uuid4()
    file_id = uuid.uuid4()
    
    db_file = FileModel(id=file_id, filename="test.png", file_type="image/png", storage_path=str(tmp_path / "test.png"))
    db_session.add(db_file)
    
    db_job = TranslationJob(id=job_id, user_id=test_user.id, file_id=file_id, source_language="en", target_language="fr", status=JobStatus.PENDING)
    db_session.add(db_job)
    db_session.commit()
    
    # Track status transitions
    statuses = []
    
    # Create a wrapper for original commit to spy on it or we can just spy _update_job_state
    # Actually, we can patch _update_job_state inside document_tasks.py
    
    mock_processor = MagicMock()
    def fake_extract_text(path, progress_callback=None):
        if progress_callback:
            progress_callback("OCR", 1, 1)
        return ["Chunk1"]
        
    mock_processor.extract_text.side_effect = fake_extract_text
    mock_processor.generate_translated_file.return_value = str(tmp_path / "translated.txt")
    (tmp_path / "translated.txt").write_text("Chunk1_FR")
    mock_factory.get_processor.return_value = mock_processor
    
    mock_ts.translate_text = AsyncMock(return_value=("Chunk1_FR", "AI Translated"))
    
    with patch("app.tasks.document_tasks._update_job_state") as mock_update_state:
        # 8. Job status transitions
        await run_document_pipeline_async(job_id, file_id, "en", "fr", test_user.id)
        
        # Check call args of mock_update_state
        called_statuses = [call.args[1] for call in mock_update_state.call_args_list]
        
        assert JobStatus.EXTRACTING_TEXT in called_statuses
        assert JobStatus.PERFORMING_OCR in called_statuses
        assert JobStatus.TRANSLATING_DOCUMENT in called_statuses
        assert JobStatus.GENERATING_PDF in called_statuses
        assert JobStatus.COMPLETED in called_statuses
