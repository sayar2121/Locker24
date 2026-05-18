import os
import shutil
from fastapi import UploadFile
from app.core.config import settings

class LocalStorageService:
    def __init__(self, upload_dir: str = settings.UPLOAD_DIR):
        self.upload_dir = upload_dir
        if not os.path.exists(self.upload_dir):
            os.makedirs(self.upload_dir)

    async def save_file(self, file: UploadFile, folder: str = "") -> str:
        """Saves a file to local storage and returns the relative path."""
        target_dir = os.path.join(self.upload_dir, folder)
        if not os.path.exists(target_dir):
            os.makedirs(target_dir)
            
        file_path = os.path.join(target_dir, file.filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        return file_path

    def delete_file(self, file_path: str):
        """Deletes a file from local storage."""
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception as e:
            print(f"Warning: Failed to delete physical file {file_path}: {e}")

storage_service = LocalStorageService()
