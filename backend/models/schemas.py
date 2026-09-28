from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field

# Auth schemas
class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: str = Field("student", pattern="^(student|teacher|admin)$")

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

# Course schemas
class CourseCreate(BaseModel):
    course_code: str = Field(..., min_length=2, max_length=20)
    course_name: str = Field(..., min_length=3, max_length=255)

class CourseResponse(BaseModel):
    id: str
    course_code: str
    course_name: str
    teacher_id: str
    teacher_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Assignment schemas
class AssignmentCreate(BaseModel):
    course_id: str
    title: str = Field(..., min_length=3, max_length=255)
    description: Optional[str] = None
    deadline: datetime
    max_marks: float = Field(100.0, gt=0)
    allowed_extensions: Optional[str] = ".pdf,.docx,.zip,.png,.jpg,.txt"
    max_file_size_mb: Optional[int] = 25
    allow_late_submissions: Optional[bool] = True

class AssignmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    deadline: Optional[datetime] = None
    max_marks: Optional[float] = None
    allowed_extensions: Optional[str] = None
    max_file_size_mb: Optional[int] = None
    allow_late_submissions: Optional[bool] = None

class AssignmentResponse(BaseModel):
    id: str
    course_id: str
    course_code: Optional[str] = None
    course_name: Optional[str] = None
    title: str
    description: Optional[str] = None
    deadline: datetime
    max_marks: float
    allowed_extensions: str
    max_file_size_mb: int
    allow_late_submissions: bool
    created_by: str
    creator_name: Optional[str] = None
    created_at: datetime
    
    # Computed fields for student
    submission_status: Optional[str] = "NOT_SUBMITTED"
    my_submission_id: Optional[str] = None
    my_marks: Optional[float] = None
    my_feedback: Optional[str] = None
    my_submitted_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Submission schemas
class SubmissionResponse(BaseModel):
    id: str
    assignment_id: str
    assignment_title: Optional[str] = None
    course_code: Optional[str] = None
    student_id: str
    student_name: Optional[str] = None
    student_email: Optional[str] = None
    file_name: str
    file_url: str
    storage_path: str
    file_size_bytes: int
    mime_type: str
    version: int
    submitted_at: datetime
    submission_status: str
    marks: Optional[float] = None
    max_marks: Optional[float] = 100.0
    feedback: Optional[str] = None
    graded_by: Optional[str] = None
    grader_name: Optional[str] = None
    graded_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Grade / Feedback schemas
class GradeSubmission(BaseModel):
    marks: float = Field(..., ge=0)
    feedback: str = Field(..., min_length=1)

# Dashboard schemas
class StudentDashboardStats(BaseModel):
    total_assignments: int
    pending_assignments: int
    submitted_assignments: int
    late_assignments: int
    graded_assignments: int
    upcoming_deadlines: List[AssignmentResponse]
    recent_feedback: List[SubmissionResponse]

class TeacherDashboardStats(BaseModel):
    total_assignments: int
    total_students: int
    total_submissions: int
    pending_reviews: int
    late_submissions: int
    graded_submissions: int
    recent_submissions: List[SubmissionResponse]
    upcoming_deadlines: List[AssignmentResponse]
