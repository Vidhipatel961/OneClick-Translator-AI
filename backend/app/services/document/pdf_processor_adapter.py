from typing import List, Callable, Optional
from app.services.document.base import DocumentProcessor
from app.services.pdf_processor import PDFProcessor

class PDFProcessorAdapter(DocumentProcessor):
    def __init__(self):
        self._pdf_proc = PDFProcessor()
        
    def validate(self, file_path: str):
        self._pdf_proc.validate_pdf(file_path)
        
    def extract_text(self, file_path: str, progress_callback: Optional[Callable[[str, int, int], None]] = None, lang: str = "en") -> List[str]:
        pages_text, _ = self._pdf_proc.process_and_extract(file_path, progress_callback)
        return pages_text
        
    def generate_translated_file(self, original_file_path: str, translated_texts: List[str], output_dir: str) -> str:
        self._pdf_proc.upload_dir = output_dir
        return self._pdf_proc.generate_translated_pdf(translated_texts)
