from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database.db import get_db
from backend.database.models import Course, User
from backend.models.schemas import CourseCreate, CourseResponse
from backend.services.auth_service import get_current_user, require_teacher

router = APIRouter(prefix="/api/courses", tags=["Courses"])

@router.get("", response_model=list[CourseResponse])
def list_courses(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Returns all available courses."""
    courses = db.query(Course).all()
    results = []
    for c in courses:
        results.append({
            "id": c.id,
            "course_code": c.course_code,
            "course_name": c.course_name,
            "teacher_id": c.teacher_id,
            "teacher_name": c.teacher.name if c.teacher else "Instructor",
            "created_at": c.created_at
        })
    return results

@router.post("", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
def create_course(
    course_in: CourseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Allows a teacher or admin to create a course."""
    existing = db.query(Course).filter(Course.course_code == course_in.course_code.upper().strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Course code '{course_in.course_code}' is already registered."
        )
    
    new_course = Course(
        course_code=course_in.course_code.upper().strip(),
        course_name=course_in.course_name.strip(),
        teacher_id=current_user.id
    )
    db.add(new_course)
    db.commit()
    db.refresh(new_course)
    
    return {
        "id": new_course.id,
        "course_code": new_course.course_code,
        "course_name": new_course.course_name,
        "teacher_id": new_course.teacher_id,
        "teacher_name": current_user.name,
        "created_at": new_course.created_at
    }
