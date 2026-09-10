import os
from app.services.document.base import DocumentProcessor
from app.services.document.pdf_processor_adapter import PDFProcessorAdapter
from app.services.document.docx_processor import DOCXProcessor
from app.services.document.pptx_processor import PPTXProcessor
from app.services.document.image_processor import ImageProcessor
from app.services.document.txt_processor import TXTProcessor
from app.core.exceptions import BaseLingoraException

class DocumentProcessorFactory:
    @staticmethod
    def get_processor(file_path: str) -> DocumentProcessor:
        ext = os.path.splitext(file_path)[1].lower()
        if ext == ".pdf":
            return PDFProcessorAdapter()
        elif ext in [".docx", ".doc"]:
            return DOCXProcessor()
        elif ext in [".pptx", ".ppt"]:
            return PPTXProcessor()
        elif ext in [".txt"]:
            return TXTProcessor()
        elif ext in [".png", ".jpg", ".jpeg", ".webp"]:
            return ImageProcessor()
        else:
            raise BaseLingoraException(f"Unsupported document type: {ext}")
