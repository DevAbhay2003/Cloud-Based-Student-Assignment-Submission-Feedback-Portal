from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database.db import get_db
from backend.database.models import Submission, User
from backend.models.schemas import GradeSubmission, SubmissionResponse
from backend.services.auth_service import get_current_user, require_teacher
from backend.routes.submission_routes import map_submission_response

router = APIRouter(prefix="/api/submissions", tags=["Grading & Feedback"])

@router.post("/{id}/grade", response_model=SubmissionResponse)
def grade_submission(
    id: str,
    grade_data: GradeSubmission,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """
    Teacher evaluates a student submission.
    Validates marks do not exceed the maximum allowed for the assignment.
    Records timestamp, grader identity, and updates status to 'GRADED'.
    """
    sub = db.query(Submission).filter(Submission.id == id).first()
    if not sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found.")

    assignment = sub.assignment
    if grade_data.marks > assignment.max_marks:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Marks entered ({grade_data.marks}) cannot exceed maximum allowed marks ({assignment.max_marks})."
        )

    sub.marks = round(grade_data.marks, 2)
    sub.feedback = grade_data.feedback.strip()
    sub.graded_by = current_user.id
    sub.graded_at = datetime.now(timezone.utc)
    sub.submission_status = "GRADED"

    db.commit()
    db.refresh(sub)
    return map_submission_response(sub)


@router.get("/{id}/feedback")
def get_submission_feedback(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns feedback and score for a submission. Student must own the submission or user must be teacher."""
    sub = db.query(Submission).filter(Submission.id == id).first()
    if not sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found.")

    if current_user.role == "student" and sub.student_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You cannot view feedback for another student's submission."
        )

    return {
        "submission_id": sub.id,
        "assignment_title": sub.assignment.title if sub.assignment else "",
        "marks": sub.marks,
        "max_marks": sub.assignment.max_marks if sub.assignment else 100.0,
        "feedback": sub.feedback,
        "graded_by_name": sub.grader.name if sub.grader else None,
        "graded_at": sub.graded_at,
        "submission_status": sub.submission_status
    }
