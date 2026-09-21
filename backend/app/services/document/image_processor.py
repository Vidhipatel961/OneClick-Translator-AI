import os
import uuid
from typing import List, Callable, Optional
from PIL import Image
from app.services.providers.tesseract_provider import TesseractOCRProvider
from app.services.document.base import DocumentProcessor
from app.core.exceptions import BaseLingoraException

class ImageProcessor(DocumentProcessor):
    def __init__(self, ocr_provider=None):
        self.ocr_provider = ocr_provider or TesseractOCRProvider()
        
    def validate(self, file_path: str):
        if not os.path.exists(file_path):
            raise BaseLingoraException("File not found.")
        size_mb = os.path.getsize(file_path) / (1024 * 1024)
        if size_mb > 20:
            raise BaseLingoraException("Image size exceeds 20MB limit.")
            
    def extract_text(self, file_path: str, progress_callback: Optional[Callable[[str, int, int], None]] = None, lang: str = "en") -> List[str]:
        self.validate(file_path)
        try:
            if progress_callback:
                progress_callback("OCR", 1, 1)
            img = Image.open(file_path)
            self.last_image_path = file_path
            result = self.ocr_provider.extract_text(img, lang=lang)
            # Ensure 1-to-1 mapping with regions for visual inpainting
            valid_regions = [r for r in (result.regions or []) if r.text and r.text.strip()]
            self.last_regions = valid_regions
            
            # Handle no-text-detected state
            if not valid_regions and not result.full_text.strip():
                return []
                
            if valid_regions:
                return [r.text.strip() for r in valid_regions]
                
            # Split by lines fallback
            chunks = [c.strip() for c in result.full_text.split("\n") if c.strip()]
            return chunks
        except Exception as e:
            raise BaseLingoraException(f"Failed to process image OCR: {str(e)}")
            
    def generate_translated_file(self, original_file_path: str, translated_texts: List[str], output_dir: str) -> str:
        from app.services.image_processing import ImageProcessor as VisualImageProcessor
        
        os.makedirs(output_dir, exist_ok=True)
        output_path = os.path.join(output_dir, f"translated_image_{uuid.uuid4().hex[:8]}.png")
        
        try:
            img = Image.open(self.last_image_path)
            if hasattr(self, 'last_regions') and self.last_regions:
                # 1. Mask original text
                cleaned_img = VisualImageProcessor.remove_text_from_image(img, self.last_regions, padding=2)
                # 2. Draw translated text
                final_img = VisualImageProcessor.draw_translated_text(cleaned_img, self.last_regions, translated_texts)
                final_img.save(output_path, "PNG")
            else:
                img.save(output_path, "PNG")
                
        except Exception as e:
            # Fallback to TXT if visual rendering fails
            output_path = os.path.join(output_dir, f"translated_image_{uuid.uuid4().hex[:8]}.txt")
            with open(output_path, "w", encoding="utf-8") as f:
                f.write("\n".join(translated_texts))
                
        return output_path
