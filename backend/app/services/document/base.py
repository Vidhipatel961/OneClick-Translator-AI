from abc import ABC, abstractmethod
from typing import List, Callable, Optional

class DocumentProcessor(ABC):
    @abstractmethod
    def validate(self, file_path: str):
        """Validate file size, security, and format."""
        pass
        
    @abstractmethod
    def extract_text(self, file_path: str, progress_callback: Optional[Callable[[str, int, int], None]] = None, lang: str = "en") -> List[str]:
        """Extract text chunks from the document."""
        pass
        
    @abstractmethod
    def generate_translated_file(self, original_file_path: str, translated_texts: List[str], output_dir: str) -> str:
        """Generate the translated document preserving layout where possible."""
        pass
