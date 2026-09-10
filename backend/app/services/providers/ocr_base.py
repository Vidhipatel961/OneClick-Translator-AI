from abc import ABC, abstractmethod
from pydantic import BaseModel
from typing import List, Any

class OCRRegion(BaseModel):
    text: str
    left: int
    top: int
    width: int
    height: int
    confidence: float = 0.0

class OCRResult(BaseModel):
    full_text: str
    regions: List[OCRRegion]

class OCRProvider(ABC):
    @abstractmethod
    def extract_text(self, image: Any, lang: str = "en") -> OCRResult:
        """
        Extract text and layout information from an image.
        
        :param image: PIL Image object or equivalent image data.
        :return: OCRResult containing full text and regional bounding boxes.
        """
        pass
