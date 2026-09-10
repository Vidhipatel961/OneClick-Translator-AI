import os
import uuid
from typing import List, Callable, Optional
from app.services.document.base import DocumentProcessor
from app.core.exceptions import BaseLingoraException

class TXTProcessor(DocumentProcessor):
    def validate(self, file_path: str):
        if not os.path.exists(file_path):
            raise BaseLingoraException("File not found.")
        size_mb = os.path.getsize(file_path) / (1024 * 1024)
        if size_mb > 10:
            raise BaseLingoraException("TXT size exceeds 10MB limit.")
            
    def extract_text(self, file_path: str, progress_callback: Optional[Callable[[str, int, int], None]] = None, lang: str = "en") -> List[str]:
        self.validate(file_path)
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        # Split by paragraphs for chunking
        chunks = [c.strip() for c in content.split("\n\n") if c.strip()]
        return chunks
        
    def generate_translated_file(self, original_file_path: str, translated_texts: List[str], output_dir: str) -> str:
        os.makedirs(output_dir, exist_ok=True)
        output_path = os.path.join(output_dir, f"translated_{uuid.uuid4().hex[:8]}.txt")
        with open(output_path, "w", encoding="utf-8") as f:
            f.write("\n\n".join(translated_texts))
        return output_path
