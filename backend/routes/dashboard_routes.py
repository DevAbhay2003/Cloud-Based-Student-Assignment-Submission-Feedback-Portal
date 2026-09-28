from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database.db import get_db
from backend.database.models import User
from backend.models.schemas import StudentDashboardStats, TeacherDashboardStats
from backend.services.auth_service import require_student, require_teacher
from backend.services.analytics_service import (
    get_student_dashboard_metrics,
    get_teacher_dashboard_metrics
)

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard & Analytics"])

@router.get("/student", response_model=StudentDashboardStats)
def get_student_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student)
):
    """Retrieves real-time student metrics, upcoming deadlines, and feedback."""
    return get_student_dashboard_metrics(current_user.id, db)


@router.get("/teacher", response_model=TeacherDashboardStats)
def get_teacher_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Retrieves teacher metrics, submission review queues, and recent uploads."""
    return get_teacher_dashboard_metrics(current_user.id, db)
