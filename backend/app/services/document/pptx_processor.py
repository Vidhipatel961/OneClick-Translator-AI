import os
import uuid
from typing import List, Callable, Optional
from pptx import Presentation
from app.services.document.base import DocumentProcessor
from app.core.exceptions import BaseLingoraException

class PPTXProcessor(DocumentProcessor):
    def validate(self, file_path: str):
        if not os.path.exists(file_path):
            raise BaseLingoraException("File not found.")
        size_mb = os.path.getsize(file_path) / (1024 * 1024)
        if size_mb > 50:
            raise BaseLingoraException("PPTX size exceeds 50MB limit.")
            
    def _iter_text_frames(self, prs):
        """Yield all text frames in presentation."""
        for slide in prs.slides:
            for shape in slide.shapes:
                if hasattr(shape, "text_frame") and shape.text_frame:
                    yield shape.text_frame

    def extract_text(self, file_path: str, progress_callback: Optional[Callable[[str, int, int], None]] = None, lang: str = "en") -> List[str]:
        self.validate(file_path)
        prs = Presentation(file_path)
        chunks = []
        for tf in self._iter_text_frames(prs):
            if tf.text.strip():
                chunks.append(tf.text)
        return chunks
        
    def generate_translated_file(self, original_file_path: str, translated_texts: List[str], output_dir: str) -> str:
        prs = Presentation(original_file_path)
        
        trans_idx = 0
        for tf in self._iter_text_frames(prs):
            if tf.text.strip():
                if trans_idx < len(translated_texts):
                    tf.text = translated_texts[trans_idx]
                    trans_idx += 1
                    
        os.makedirs(output_dir, exist_ok=True)
        output_path = os.path.join(output_dir, f"translated_{uuid.uuid4().hex[:8]}.pptx")
        prs.save(output_path)
        return output_path
