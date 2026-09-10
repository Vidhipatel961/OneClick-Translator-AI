from fastapi import APIRouter
from typing import List
from app.schemas.language import LanguageConfig
from app.core.languages import LANGUAGES

router = APIRouter()

@router.get("", response_model=List[LanguageConfig])
def get_languages():
    """Retrieve all enabled languages configured in Lingora AI."""
    return [lang for lang in LANGUAGES if lang.enabled]
