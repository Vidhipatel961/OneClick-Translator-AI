from abc import ABC, abstractmethod
from typing import BinaryIO
import uuid

class StorageProvider(ABC):
    @abstractmethod
    async def save_file(self, file_id: uuid.UUID, filename: str, file_stream: BinaryIO) -> str:
        """Save a file and return its storage path or URL."""
        pass
    
    @abstractmethod
    async def delete_file(self, storage_path: str) -> bool:
        """Delete a file given its storage path or URL."""
        pass
