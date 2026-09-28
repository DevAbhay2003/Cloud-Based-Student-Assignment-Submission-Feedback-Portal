from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from backend.database.db import get_db
from backend.database.models import Assignment, Course, Submission, User
from backend.models.schemas import AssignmentCreate, AssignmentUpdate, AssignmentResponse
from backend.services.auth_service import get_current_user, require_teacher

router = APIRouter(prefix="/api/assignments", tags=["Assignments"])

def map_assignment_response(assignment: Assignment, current_user: User, db: Session) -> dict:
    sub = None
    if current_user.role == "student":
        sub = (
            db.query(Submission)
            .filter(
                Submission.assignment_id == assignment.id,
                Submission.student_id == current_user.id
            )
            .first()
        )
    return {
        "id": assignment.id,
        "course_id": assignment.course_id,
        "course_code": assignment.course.course_code if assignment.course else "",
        "course_name": assignment.course.course_name if assignment.course else "",
        "title": assignment.title,
        "description": assignment.description,
        "deadline": assignment.deadline,
        "max_marks": assignment.max_marks,
        "allowed_extensions": assignment.allowed_extensions,
        "max_file_size_mb": assignment.max_file_size_mb,
        "allow_late_submissions": assignment.allow_late_submissions,
        "created_by": assignment.created_by,
        "creator_name": assignment.creator.name if assignment.creator else "Instructor",
        "created_at": assignment.created_at,
        "submission_status": sub.submission_status if sub else "NOT_SUBMITTED",
        "my_submission_id": sub.id if sub else None,
        "my_marks": sub.marks if sub else None,
        "my_feedback": sub.feedback if sub else None,
        "my_submitted_at": sub.submitted_at if sub else None
    }


@router.post("", response_model=AssignmentResponse, status_code=status.HTTP_201_CREATED)
def create_assignment(
    assignment_in: AssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Teacher creates an assignment with deadline and file constraints."""
    course = db.query(Course).filter(Course.id == assignment_in.course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Course with ID '{assignment_in.course_id}' does not exist."
        )

    # Ensure deadline is timezone-aware
    deadline = assignment_in.deadline
    if deadline.tzinfo is None:
        deadline = deadline.replace(tzinfo=timezone.utc)

    new_assignment = Assignment(
        course_id=assignment_in.course_id,
        title=assignment_in.title.strip(),
        description=assignment_in.description.strip() if assignment_in.description else "",
        deadline=deadline,
        max_marks=assignment_in.max_marks,
        allowed_extensions=assignment_in.allowed_extensions or ".pdf,.docx,.zip,.png,.jpg,.txt",
        max_file_size_mb=assignment_in.max_file_size_mb or 25,
        allow_late_submissions=assignment_in.allow_late_submissions if assignment_in.allow_late_submissions is not None else True,
        created_by=current_user.id
    )
    db.add(new_assignment)
    db.commit()
    db.refresh(new_assignment)

    return map_assignment_response(new_assignment, current_user, db)


@router.get("", response_model=list[AssignmentResponse])
def get_assignments(
    course_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve all assignments, optionally filtered by course."""
    query = db.query(Assignment)
    if course_id:
        query = query.filter(Assignment.course_id == course_id)
    
    assignments = query.order_by(Assignment.deadline.asc()).all()
    return [map_assignment_response(a, current_user, db) for a in assignments]


@router.get("/{id}", response_model=AssignmentResponse)
def get_assignment_by_id(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetch details of a single assignment."""
    assignment = db.query(Assignment).filter(Assignment.id == id).first()
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found."
        )
    return map_assignment_response(assignment, current_user, db)


@router.put("/{id}", response_model=AssignmentResponse)
def update_assignment(
    id: str,
    update_in: AssignmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Teacher updates assignment details."""
    assignment = db.query(Assignment).filter(Assignment.id == id).first()
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found.")

    # Only creator or admin can update
    if assignment.created_by != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only edit assignments created by yourself."
        )

    if update_in.title is not None:
        assignment.title = update_in.title.strip()
    if update_in.description is not None:
        assignment.description = update_in.description.strip()
    if update_in.deadline is not None:
        deadline = update_in.deadline
        if deadline.tzinfo is None:
            deadline = deadline.replace(tzinfo=timezone.utc)
        assignment.deadline = deadline
    if update_in.max_marks is not None:
        assignment.max_marks = update_in.max_marks
    if update_in.allowed_extensions is not None:
        assignment.allowed_extensions = update_in.allowed_extensions
    if update_in.max_file_size_mb is not None:
        assignment.max_file_size_mb = update_in.max_file_size_mb
    if update_in.allow_late_submissions is not None:
        assignment.allow_late_submissions = update_in.allow_late_submissions

    db.commit()
    db.refresh(assignment)
    return map_assignment_response(assignment, current_user, db)


@router.delete("/{id}", status_code=status.HTTP_200_OK)
def delete_assignment(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Deletes an assignment and associated submissions."""
    assignment = db.query(Assignment).filter(Assignment.id == id).first()
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found.")

    if assignment.created_by != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete assignments created by yourself."
        )

    db.delete(assignment)
    db.commit()
    return {"message": f"Assignment '{assignment.title}' deleted successfully."}
