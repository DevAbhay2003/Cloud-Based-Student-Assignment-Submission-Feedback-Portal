"""
Cloud Database Adapter Service
Manages connections to Cloud Relational Databases (PostgreSQL / Supabase / Neon / AWS RDS / SQLite).
Demonstrates pooling, health checks, connection strings, and multi-cloud readiness.
"""

import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from typing import Generator

# Read database URL from environment (defaults to local SQLite for zero-cost execution)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./portal.db")

# PostgreSQL / Supabase connection pooling configuration vs SQLite thread handling
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,  # Automatically detect stale connections in cloud pooled environments
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_cloud_db() -> Generator:
    """Dependency that provides a database session and safely closes it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_cloud_db_health() -> dict:
    """Performs a lightweight probe for Cloud Load Balancers and Health Checkers."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "provider": "PostgreSQL (Cloud)" if "postgres" in DATABASE_URL else "SQLite (Cloud Simulation)",
            "database_connected": True
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "database_connected": False
        }
