import os
import uuid
import pymupdf  # fitz
from PIL import Image
import io
from app.core.exceptions import BaseLingoraException
from app.core.logging import logger
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.utils import simpleSplit

class PDFProcessor:
    def __init__(self, upload_dir: str = "uploads"):
        self.upload_dir = upload_dir
        os.makedirs(self.upload_dir, exist_ok=True)
        
    def validate_pdf(self, file_path: str):
        """Security and size validation."""
        if not os.path.exists(file_path):
            raise BaseLingoraException("File not found.")
        size_mb = os.path.getsize(file_path) / (1024 * 1024)
        if size_mb > 50:
            raise BaseLingoraException("PDF size exceeds 50MB limit.")
            
        try:
            doc = pymupdf.open(file_path)
            if doc.needs_pass:
                raise BaseLingoraException("Encrypted PDFs are not supported.")
            doc.close()
        except Exception as e:
            if isinstance(e, BaseLingoraException):
                raise
            raise BaseLingoraException("Invalid or corrupted PDF file.")
            
    def process_and_extract(self, file_path: str, progress_callback=None):
        """
        Extract text from PDF.
        If a page has no text, assume it's scanned and run OCR.
        """
        self.validate_pdf(file_path)
        doc = pymupdf.open(file_path)
        pages_text = []
        page_count = len(doc)
        
        for i in range(page_count):
            page = doc[i]
            text = page.get_text("text").strip()
            
            if not text:
                # Potential Scanned Page -> Run OCR
                if progress_callback:
                    progress_callback("OCR", i + 1, page_count)
                try:
                    pix = page.get_pixmap()
                    img = Image.open(io.BytesIO(pix.tobytes("png")))
                    
                    from app.services.providers.tesseract_provider import TesseractOCRProvider
                    ocr_provider = TesseractOCRProvider()
                    result = ocr_provider.extract_text(img)
                    text = result.full_text
                except Exception as e:
                    logger.warning(f"OCR failed on page {i}: {e}")
                    text = ""
                    
            pages_text.append(text)
            
        doc.close()
        return pages_text, page_count
        
    def generate_translated_pdf(self, pages_text: list[str]) -> str:
        """Generate a basic layout-preserving PDF using ReportLab."""
        output_path = os.path.join(self.upload_dir, f"translated_document_{uuid.uuid4().hex[:8]}.pdf")
        
        c = canvas.Canvas(output_path, pagesize=letter)
        width, height = letter
        
        for text in pages_text:
            # Very basic text layout generator
            textobject = c.beginText()
            textobject.setTextOrigin(40, height - 40)
            textobject.setFont("Helvetica", 10)
            
            lines = text.split('\n')
            for line in lines:
                wrapped_lines = simpleSplit(line, "Helvetica", 10, width - 80)
                for wl in wrapped_lines:
                    if textobject.getY() < 40:
                        c.drawText(textobject)
                        c.showPage()
                        textobject = c.beginText()
                        textobject.setTextOrigin(40, height - 40)
                        textobject.setFont("Helvetica", 10)
                    textobject.textLine(wl)
                    
            c.drawText(textobject)
            c.showPage()
            
        c.save()
        return output_path
