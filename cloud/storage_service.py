"""
Cloud Storage Adapter Service
Demonstrates Cloud Object Storage integration (AWS S3, Google Cloud Storage, Supabase Storage, and Local Bucket simulation).
Provides unified API for uploading, streaming, deleting, and generating signed pre-authenticated URLs.
"""

import os
import io
import shutil
from pathlib import Path
from typing import BinaryIO, Optional
from fastapi import HTTPException, status


class BaseCloudStorage:
    """Standard interface for Cloud Object Storage."""

    def upload(self, file_data: BinaryIO, storage_key: str, content_type: str = "application/octet-stream") -> str:
        raise NotImplementedError

    def download_stream(self, storage_key: str):
        raise NotImplementedError

    def delete(self, storage_key: str) -> bool:
        raise NotImplementedError

    def generate_signed_url(self, storage_key: str, expiry_seconds: int = 3600) -> str:
        raise NotImplementedError


class LocalBucketStore(BaseCloudStorage):
    """
    Simulates AWS S3 or Google Cloud Storage using an isolated local directory.
    Hierarchy: assignments/{assignment_id}/{student_id}/{filename}
    """
    def __init__(self, bucket_root: str = "cloud_storage_bucket"):
        self.bucket_root = Path(bucket_root).resolve()
        self.bucket_root.mkdir(parents=True, exist_ok=True)

    def _resolve_safe_path(self, storage_key: str) -> Path:
        normalized = storage_key.lstrip("/").replace("\\", "/")
        target = (self.bucket_root / normalized).resolve()
        if not str(target).startswith(str(self.bucket_root)):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Security Violation: Invalid file path traversal."
            )
        return target

    def upload(self, file_data: BinaryIO, storage_key: str, content_type: str = "application/octet-stream") -> str:
        dest_path = self._resolve_safe_path(storage_key)
        dest_path.parent.mkdir(parents=True, exist_ok=True)
        with open(dest_path, "wb") as out_f:
            shutil.copyfileobj(file_data, out_f)
        return storage_key

    def download_stream(self, storage_key: str):
        target = self._resolve_safe_path(storage_key)
        if not target.exists() or not target.is_file():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Object not found in Cloud Storage bucket."
            )
        return open(target, "rb")

    def delete(self, storage_key: str) -> bool:
        try:
            target = self._resolve_safe_path(storage_key)
            if target.exists():
                target.unlink()
                return True
            return False
        except Exception:
            return False

    def generate_signed_url(self, storage_key: str, expiry_seconds: int = 3600) -> str:
        # In production cloud, this generates an AWS S3 presigned URL or Firebase token URL
        return f"/api/submissions/download?key={storage_key}&expires={expiry_seconds}"


class S3CloudStorage(BaseCloudStorage):
    """
    AWS S3 Production Cloud Storage provider.
    Connects to real AWS S3 using boto3 when AWS credentials are provided.
    """
    def __init__(self, bucket_name: str, region: str = "us-east-1"):
        self.bucket_name = bucket_name
        self.region = region
        try:
            import boto3
            self.s3_client = boto3.client("s3", region_name=region)
        except ImportError:
            self.s3_client = None

    def upload(self, file_data: BinaryIO, storage_key: str, content_type: str = "application/octet-stream") -> str:
        if not self.s3_client:
            raise RuntimeError("boto3 is required for AWS S3 storage.")
        self.s3_client.upload_fileobj(
            file_data,
            self.bucket_name,
            storage_key,
            ExtraArgs={"ContentType": content_type}
        )
        return storage_key

    def download_stream(self, storage_key: str):
        if not self.s3_client:
            raise RuntimeError("boto3 is required for AWS S3 storage.")
        response = self.s3_client.get_object(Bucket=self.bucket_name, Key=storage_key)
        return response["Body"]

    def delete(self, storage_key: str) -> bool:
        if not self.s3_client:
            return False
        self.s3_client.delete_object(Bucket=self.bucket_name, Key=storage_key)
        return True

    def generate_signed_url(self, storage_key: str, expiry_seconds: int = 3600) -> str:
        if not self.s3_client:
            raise RuntimeError("boto3 is required for AWS S3 storage.")
        return self.s3_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.bucket_name, "Key": storage_key},
            ExpiresIn=expiry_seconds
        )


def get_cloud_storage() -> BaseCloudStorage:
    """Factory creating appropriate storage adapter based on environment."""
    provider_type = os.getenv("STORAGE_PROVIDER", "LOCAL").upper()
    if provider_type == "S3":
        bucket = os.getenv("AWS_S3_BUCKET_NAME", "student-submissions-bucket")
        region = os.getenv("AWS_REGION", "us-east-1")
        return S3CloudStorage(bucket_name=bucket, region=region)
    return LocalBucketStore(os.getenv("CLOUD_STORAGE_LOCAL_DIR", "cloud_storage_bucket"))
