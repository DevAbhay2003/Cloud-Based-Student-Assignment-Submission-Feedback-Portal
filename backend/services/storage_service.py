import os
import re
import shutil
from pathlib import Path
from typing import Tuple, BinaryIO
from fastapi import UploadFile, HTTPException, status
from backend.config import settings

class CloudStorageProvider:
    """Abstract interface defining Cloud Object Storage operations (S3/GCS/Supabase/Local)."""
    
    def upload_file(self, file_obj: BinaryIO, storage_path: str) -> str:
        raise NotImplementedError

    def get_file_stream(self, storage_path: str):
        raise NotImplementedError

    def delete_file(self, storage_path: str) -> bool:
        raise NotImplementedError

    def generate_signed_url(self, storage_path: str, expiry_seconds: int = 3600) -> str:
        raise NotImplementedError


class LocalBucketStorageProvider(CloudStorageProvider):
    """
    Local simulation of Cloud Object Storage (e.g., AWS S3 / Firebase Storage / Supabase Storage).
    Maintains a dedicated bucket directory structure:
    assignments/{assignment_id}/{student_id}/{sanitized_filename}
    """
    def __init__(self, base_bucket_dir: str):
        self.base_dir = Path(base_bucket_dir).resolve()
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def _resolve_full_path(self, storage_path: str) -> Path:
        clean_path = storage_path.lstrip("/").replace("\\", "/")
        full_path = (self.base_dir / clean_path).resolve()
        # Prevent Directory Traversal attacks
        if not str(full_path).startswith(str(self.base_dir)):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid storage path detected."
            )
        return full_path

    def upload_file(self, file_obj: BinaryIO, storage_path: str) -> str:
        full_path = self._resolve_full_path(storage_path)
        full_path.parent.mkdir(parents=True, exist_ok=True)
        with open(full_path, "wb") as buffer:
            shutil.copyfileobj(file_obj, buffer)
        return storage_path

    def get_file_stream(self, storage_path: str):
        full_path = self._resolve_full_path(storage_path)
        if not full_path.exists() or not full_path.is_file():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Requested file does not exist in Cloud Storage."
            )
        return open(full_path, "rb")

    def get_file_path(self, storage_path: str) -> Path:
        full_path = self._resolve_full_path(storage_path)
        if not full_path.exists() or not full_path.is_file():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found in storage bucket."
            )
        return full_path

    def delete_file(self, storage_path: str) -> bool:
        try:
            full_path = self._resolve_full_path(storage_path)
            if full_path.exists():
                full_path.unlink()
                return True
            return False
        except Exception:
            return False

    def generate_signed_url(self, storage_path: str, expiry_seconds: int = 3600) -> str:
        # In local simulation, this resolves to the secured API download endpoint
        clean_path = storage_path.lstrip("/")
        return f"/api/files/download?path={clean_path}"


def sanitize_filename(filename: str) -> str:
    """Strip dangerous characters and keep alphanumeric, underscores, hyphens, and extension."""
    filename = os.path.basename(filename)
    filename = re.sub(r"[^\w\.\-]", "_", filename)
    return filename


def validate_upload_file(file: UploadFile, allowed_exts: list[str], max_size_mb: int) -> Tuple[str, int]:
    """Validate file extension and file size limit before persisting to cloud object storage."""
    file_name = sanitize_filename(file.filename or "submission.pdf")
    ext = os.path.splitext(file_name)[1].lower()
    
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Allowed formats: {', '.join(allowed_exts)}",
        )
    
    # Check file size by seeking
    file.file.seek(0, os.SEEK_END)
    file_size_bytes = file.file.tell()
    file.file.seek(0)
    
    max_bytes = max_size_mb * 1024 * 1024
    if file_size_bytes > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {max_size_mb} MB (Uploaded size: {file_size_bytes / (1024*1024):.2f} MB).",
        )
    
    if file_size_bytes == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot upload an empty file.",
        )
        
    return file_name, file_size_bytes


# Factory to get configured storage provider
def get_storage_provider() -> CloudStorageProvider:
    if settings.STORAGE_PROVIDER == "local":
        return LocalBucketStorageProvider(settings.STORAGE_BUCKET_PATH)
    elif settings.STORAGE_PROVIDER == "s3":
        # S3 provider implementation placeholder for enterprise cloud deployment
        return LocalBucketStorageProvider(settings.STORAGE_BUCKET_PATH)
    return LocalBucketStorageProvider(settings.STORAGE_BUCKET_PATH)

storage_service = get_storage_provider()
