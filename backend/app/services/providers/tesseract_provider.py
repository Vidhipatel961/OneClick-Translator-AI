import pytesseract
from PIL import Image
from typing import Any
import os
import platform
from app.services.providers.ocr_base import OCRProvider, OCRResult, OCRRegion
from app.core.exceptions import BaseLingoraException
from app.core.logging import logger

# Automatically configure Tesseract on Windows if it's installed in the default location
if platform.system() == "Windows":
    default_paths = [
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        r"C:\Users\Dell\AppData\Local\Programs\Tesseract-OCR\tesseract.exe"
    ]
    for path in default_paths:
        if os.path.exists(path):
            pytesseract.pytesseract.tesseract_cmd = path
            break

# Point Tesseract to our locally downloaded language packs
local_tessdata = os.path.join(os.path.dirname(__file__), "..", "..", "..", "tessdata")
local_tessdata = os.path.abspath(local_tessdata)
os.environ["TESSDATA_PREFIX"] = local_tessdata

class TesseractOCRProvider(OCRProvider):
    """
    Tesseract OCR Provider.
    
    Local Installation Requirements:
    - Windows: Download and install Tesseract-OCR from https://github.com/UB-Mannheim/tesseract/wiki. Add the installation directory (e.g., C:\\Program Files\\Tesseract-OCR) to your system PATH.
    - Linux: sudo apt-get install tesseract-ocr
    - macOS: brew install tesseract
    """
    
    TESSERACT_LANG_MAP = {
        "en": "eng",
        "gu": "guj",
        "hi": "hin",
        "fr": "fra",
        "es": "spa",
        "de": "deu",
        "zh": "chi_sim",
        "ar": "ara"
    }

    def extract_text(self, image: Any, lang: str = "en") -> OCRResult:
        if not isinstance(image, Image.Image):
            raise BaseLingoraException("Unsupported image format. Expected PIL Image.")
            
        try:
            if lang == "auto":
                # Find all downloaded language packs to use them simultaneously
                available_langs = []
                if os.path.exists(local_tessdata):
                    for file in os.listdir(local_tessdata):
                        if file.endswith(".traineddata") and not file.startswith("osd"):
                            available_langs.append(file.split(".")[0])
                
                tess_lang = "+".join(available_langs) if available_langs else "eng"
            else:
                tess_lang = self.TESSERACT_LANG_MAP.get(lang, "eng")
            # Extract structured data using pytesseract
            data = pytesseract.image_to_data(image, lang=tess_lang, output_type=pytesseract.Output.DICT)
            
            regions = []
            words = []
            
            n_boxes = len(data['level'])
            for i in range(n_boxes):
                text = data['text'][i].strip()
                if text:
                    words.append(text)
                    # Tesseract conf can be a string like '-1' or a float
                    try:
                        conf = float(data['conf'][i])
                    except (ValueError, TypeError):
                        conf = 0.0

                    regions.append(OCRRegion(
                        text=text,
                        left=data['left'][i],
                        top=data['top'][i],
                        width=data['width'][i],
                        height=data['height'][i],
                        confidence=conf
                    ))
                    
            # Fallback to full extraction if structured data misses some formatting (optional)
            # but joining words gives a reasonable full text output.
            full_text = " ".join(words)
            
            return OCRResult(full_text=full_text, regions=regions)
            
        except pytesseract.TesseractNotFoundError:
            logger.error("Tesseract is not installed or not in PATH.")
            raise BaseLingoraException("OCR engine is not installed on this system.")
        except Exception as e:
            logger.error(f"Tesseract OCR extraction failed: {str(e)}")
            raise BaseLingoraException(f"Failed to process image OCR: {str(e)}")
