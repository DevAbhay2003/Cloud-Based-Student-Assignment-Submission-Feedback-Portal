import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    DateTime,
    ForeignKey,
    Boolean,
    Text,
)
from sqlalchemy.orm import relationship
from backend.database.db import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="student")  # 'student', 'teacher', 'admin'
    created_at = Column(DateTime(timezone=True), default=get_utc_now)

    # Relationships
    taught_courses = relationship("Course", back_populates="teacher", cascade="all, delete-orphan")
    created_assignments = relationship("Assignment", back_populates="creator", foreign_keys="Assignment.created_by")
    submissions = relationship("Submission", back_populates="student", foreign_keys="Submission.student_id")
    graded_submissions = relationship("Submission", back_populates="grader", foreign_keys="Submission.graded_by")


class Course(Base):
    __tablename__ = "courses"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    course_code = Column(String(20), unique=True, index=True, nullable=False)
    course_name = Column(String(255), nullable=False)
    teacher_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)

    # Relationships
    teacher = relationship("User", back_populates="taught_courses")
    assignments = relationship("Assignment", back_populates="course", cascade="all, delete-orphan")


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    course_id = Column(String(36), ForeignKey("courses.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    deadline = Column(DateTime(timezone=True), nullable=False)
    max_marks = Column(Float, default=100.0, nullable=False)
    allowed_extensions = Column(String(100), default=".pdf,.docx,.zip,.png,.jpg,.txt")
    max_file_size_mb = Column(Integer, default=25)
    allow_late_submissions = Column(Boolean, default=True)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)

    # Relationships
    course = relationship("Course", back_populates="assignments")
    creator = relationship("User", back_populates="created_assignments", foreign_keys=[created_by])
    submissions = relationship("Submission", back_populates="assignment", cascade="all, delete-orphan")


class Submission(Base):
    __tablename__ = "submissions"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    assignment_id = Column(String(36), ForeignKey("assignments.id"), nullable=False, index=True)
    student_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    
    # Cloud Object Storage references
    file_name = Column(String(255), nullable=False)
    file_url = Column(String(512), nullable=False)
    storage_path = Column(String(512), nullable=False)
    file_size_bytes = Column(Integer, default=0)
    mime_type = Column(String(100), default="application/octet-stream")
    
    # Workflow metadata
    version = Column(Integer, default=1)
    submitted_at = Column(DateTime(timezone=True), default=get_utc_now)
    submission_status = Column(String(30), default="SUBMITTED")  # SUBMITTED, LATE, GRADED
    
    # Grading & Feedback
    marks = Column(Float, nullable=True)
    feedback = Column(Text, nullable=True)
    graded_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    graded_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    assignment = relationship("Assignment", back_populates="submissions")
    student = relationship("User", back_populates="submissions", foreign_keys=[student_id])
    grader = relationship("User", back_populates="graded_submissions", foreign_keys=[graded_by])
