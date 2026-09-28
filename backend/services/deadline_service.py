from datetime import datetime, timezone
from fastapi import HTTPException, status
from backend.database.models import Assignment

def evaluate_submission_deadline(assignment: Assignment, submitted_at: datetime) -> str:
    """
    Compares server UTC timestamp against the assignment deadline.
    Returns: 'SUBMITTED' or 'LATE'.
    Raises 400 if late submissions are locked.
    """
    # Ensure both are timezone-aware in UTC
    if submitted_at.tzinfo is None:
        submitted_at = submitted_at.replace(tzinfo=timezone.utc)
        
    deadline = assignment.deadline
    if deadline.tzinfo is None:
        deadline = deadline.replace(tzinfo=timezone.utc)

    if submitted_at <= deadline:
        return "SUBMITTED"
    else:
        if not assignment.allow_late_submissions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"The deadline for this assignment ({deadline.strftime('%Y-%m-%d %H:%M:%S UTC')}) has passed. Late submissions are not permitted.",
            )
        return "LATE"
