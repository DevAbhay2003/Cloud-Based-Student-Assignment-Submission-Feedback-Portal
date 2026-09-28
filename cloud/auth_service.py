"""
Cloud Authentication and Role-Based Authorization Service
Handles cryptographic password hashing, JWT token generation, role verification,
and integration adapters for Cloud Identity Providers (Firebase Auth / Supabase Auth / Cognito / Custom JWT).
"""

import os
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from passlib.context import CryptContext
from jose import jwt, JWTError
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# Cryptographic context for password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Configuration from Environment Variables
SECRET_KEY = os.getenv("SECRET_KEY", "cloud-super-secret-key-production-ready-32-chars")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))

security_scheme = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    """Hash plaintext password with Bcrypt and salt."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against stored Bcrypt hash."""
    return pwd_context.verify(plain_password, hashed_password)


def create_cloud_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Generate signed JWT containing user claims (sub, role, email, name).
    Complies with OAuth2 bearer token standards.
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta if expires_delta else timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_cloud_token(token: str) -> Dict[str, Any]:
    """Verify cryptographic signature and extract token claims."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired cloud authentication credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )
