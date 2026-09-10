import os
import asyncio
import aiofiles
from app.services.storage.base import StorageProvider
import uuid
from typing import BinaryIO

class LocalStorageProvider(StorageProvider):
    def __init__(self, upload_dir: str = "uploads"):
        self.upload_dir = upload_dir
        os.makedirs(self.upload_dir, exist_ok=True)

    async def save_file(self, file_id: uuid.UUID, filename: str, file_stream: BinaryIO) -> str:
        storage_path = os.path.join(self.upload_dir, f"{file_id}_{filename}")
        async with aiofiles.open(storage_path, 'wb') as out_file:
            # chunked reading to prevent loading large files in memory
            while content := await asyncio.to_thread(file_stream.read, 1024 * 1024):
                await out_file.write(content)
        return storage_path

    async def delete_file(self, storage_path: str) -> bool:
        if os.path.exists(storage_path):
            os.remove(storage_path)
            return True
        return False
