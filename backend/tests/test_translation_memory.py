import pytest
import uuid
from sqlalchemy.orm import Session
from app.models.domain import User, TranslationMemory
from app.services.translation import TranslationService

class DummyProvider:
    def translate(self, text: str, source_lang: str, target_lang: str) -> str:
        return f"translated_{text}_{target_lang}"

@pytest.fixture
def mock_translation_service():
    return TranslationService(provider=DummyProvider())

@pytest.fixture
def test_user(db_session: Session):
    user = User(
        email=f"test_{uuid.uuid4()}@example.com",
        hashed_password="hashed_password",
        subscription_tier="FREE"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def other_user(db_session: Session):
    user = User(
        email=f"other_{uuid.uuid4()}@example.com",
        hashed_password="hashed_password",
        subscription_tier="FREE"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.mark.asyncio
async def test_memory_hit(db_session: Session, mock_translation_service, test_user):
    # A. Memory hit
    # 1. Pre-seed memory
    memory = TranslationMemory(
        user_id=test_user.id,
        source_language="en",
        target_language="es",
        source_text="Hello world",
        target_text="Hola mundo"
    )
    db_session.add(memory)
    db_session.commit()

    # 2. Translate text matching exactly
    result, src = await mock_translation_service.translate_text(
        text="Hello world",
        source_lang="en",
        target_lang="es",
        user_id=test_user.id,
        db=db_session
    )
    
    # 3. Assert memory was hit instead of provider
    assert result == "Hola mundo"
    assert src == "Reused from Translation Memory"

@pytest.mark.asyncio
async def test_memory_miss_saves(db_session: Session, mock_translation_service, test_user):
    # B. Memory miss (should call provider and save to DB)
    result, src = await mock_translation_service.translate_text(
        text="New text",
        source_lang="en",
        target_lang="fr",
        user_id=test_user.id,
        db=db_session
    )
    
    assert result == "translated_New text_fr"
    assert src == "AI Translated"
    
    # Verify it was saved
    memories = db_session.query(TranslationMemory).filter(TranslationMemory.user_id == test_user.id).all()
    assert len(memories) == 1
    assert memories[0].source_text == "New text"
    assert memories[0].target_text == "translated_New text_fr"

@pytest.mark.asyncio
async def test_different_language_pair(db_session: Session, mock_translation_service, test_user):
    # C. Different language pair
    memory = TranslationMemory(
        user_id=test_user.id,
        source_language="en",
        target_language="es",
        source_text="Different language",
        target_text="Diferente idioma"
    )
    db_session.add(memory)
    db_session.commit()

    # Query with same text but different target lang
    result, src = await mock_translation_service.translate_text(
        text="Different language",
        source_lang="en",
        target_lang="fr", # different target
        user_id=test_user.id,
        db=db_session
    )
    
    # Should miss and hit provider
    assert result == "translated_Different language_fr"
    assert src == "AI Translated"

@pytest.mark.asyncio
async def test_different_user_memory(db_session: Session, mock_translation_service, test_user, other_user):
    # D. Different user
    memory = TranslationMemory(
        user_id=other_user.id,
        source_language="en",
        target_language="es",
        source_text="Secret text",
        target_text="Texto secreto"
    )
    db_session.add(memory)
    db_session.commit()

    # Query same text with our test_user
    result, src = await mock_translation_service.translate_text(
        text="Secret text",
        source_lang="en",
        target_lang="es",
        user_id=test_user.id,
        db=db_session
    )
    
    # Should miss because memory belongs to other_user
    assert result == "translated_Secret text_es"
    assert src == "AI Translated"

@pytest.mark.asyncio
async def test_empty_memory(db_session: Session, mock_translation_service, test_user):
    # E. Empty memory (should just use provider)
    
    result, src = await mock_translation_service.translate_text(
        text="  ", # effectively empty
        source_lang="en",
        target_lang="es",
        user_id=test_user.id,
        db=db_session
    )
    
    assert result == "  "
    assert src == "AI Translated"
    
    memories = db_session.query(TranslationMemory).all()
    assert len(memories) == 0
