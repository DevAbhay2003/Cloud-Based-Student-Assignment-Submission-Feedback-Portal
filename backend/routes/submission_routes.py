from datetime import datetime, timezone
import os
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from backend.database.db import get_db
from backend.database.models import Assignment, Submission, User
from backend.models.schemas import SubmissionResponse
from backend.services.auth_service import get_current_user, require_student, require_teacher
from backend.services.storage_service import storage_service, validate_upload_file
from backend.services.deadline_service import evaluate_submission_deadline

router = APIRouter(tags=["Submissions"])

def map_submission_response(sub: Submission) -> dict:
    return {
        "id": sub.id,
        "assignment_id": sub.assignment_id,
        "assignment_title": sub.assignment.title if sub.assignment else "",
        "course_code": sub.assignment.course.course_code if sub.assignment and sub.assignment.course else "",
        "student_id": sub.student_id,
        "student_name": sub.student.name if sub.student else "",
        "student_email": sub.student.email if sub.student else "",
        "file_name": sub.file_name,
        "file_url": sub.file_url,
        "storage_path": sub.storage_path,
        "file_size_bytes": sub.file_size_bytes,
        "mime_type": sub.mime_type,
        "version": sub.version,
        "submitted_at": sub.submitted_at,
        "submission_status": sub.submission_status,
        "marks": sub.marks,
        "max_marks": sub.assignment.max_marks if sub.assignment else 100.0,
        "feedback": sub.feedback,
        "graded_by": sub.graded_by,
        "grader_name": sub.grader.name if sub.grader else None,
        "graded_at": sub.graded_at
    }


@router.post("/api/assignments/{id}/submit", response_model=SubmissionResponse, status_code=status.HTTP_201_CREATED)
def submit_assignment(
    id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student)
):
    """
    Student uploads an assignment file.
    Validates file type, size, server-side deadline, writes to Cloud Object Storage,
    and records submission metadata in the database.
    """
    assignment = db.query(Assignment).filter(Assignment.id == id).first()
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found.")

    # 1. Parse allowed extensions
    allowed_list = [ext.strip().lower() for ext in assignment.allowed_extensions.split(",") if ext.strip()]
    if not allowed_list:
        allowed_list = [".pdf", ".docx", ".zip", ".png", ".jpg", ".txt"]

    # 2. Validate file extension and size
    file_name, file_size = validate_upload_file(file, allowed_list, assignment.max_file_size_mb)

    # 3. Server-side UTC deadline evaluation
    submitted_at = datetime.now(timezone.utc)
    status_label = evaluate_submission_deadline(assignment, submitted_at)

    # 4. Check for existing submission (Resubmission logic)
    existing_sub = (
        db.query(Submission)
        .filter(Submission.assignment_id == id, Submission.student_id == current_user.id)
        .first()
    )

    version_number = 1
    if existing_sub:
        version_number = existing_sub.version + 1

    # 5. Define Cloud Object Storage path
    # e.g., assignments/{assignment_id}/{student_id}/v{version}_{filename}
    storage_path = f"assignments/{id}/{current_user.id}/v{version_number}_{file_name}"
    
    # Upload to Cloud Object Storage Provider
    storage_service.upload_file(file.file, storage_path)
    file_url = f"/api/submissions/download-by-path?path={storage_path}"

    if existing_sub:
        # Update existing submission record (maintaining single active record with version bump)
        existing_sub.file_name = file_name
        existing_sub.file_url = f"/api/submissions/{existing_sub.id}/download"
        existing_sub.storage_path = storage_path
        existing_sub.file_size_bytes = file_size
        existing_sub.mime_type = file.content_type or "application/octet-stream"
        existing_sub.version = version_number
        existing_sub.submitted_at = submitted_at
        existing_sub.submission_status = status_label
        # Reset previous grade if student resubmits before grading or if allowed
        existing_sub.marks = None
        existing_sub.feedback = None
        existing_sub.graded_by = None
        existing_sub.graded_at = None
        db.commit()
        db.refresh(existing_sub)
        return map_submission_response(existing_sub)
    else:
        new_sub = Submission(
            assignment_id=id,
            student_id=current_user.id,
            file_name=file_name,
            file_url="",  # will be updated with id below
            storage_path=storage_path,
            file_size_bytes=file_size,
            mime_type=file.content_type or "application/octet-stream",
            version=version_number,
            submitted_at=submitted_at,
            submission_status=status_label
        )
        db.add(new_sub)
        db.commit()
        db.refresh(new_sub)
        new_sub.file_url = f"/api/submissions/{new_sub.id}/download"
        db.commit()
        db.refresh(new_sub)
        return map_submission_response(new_sub)


@router.get("/api/submissions/me", response_model=list[SubmissionResponse])
def get_my_submissions(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student)
):
    """Student retrieves list of all assignments they have submitted."""
    subs = (
        db.query(Submission)
        .filter(Submission.student_id == current_user.id)
        .order_by(Submission.submitted_at.desc())
        .all()
    )
    return [map_submission_response(s) for s in subs]


@router.get("/api/assignments/{id}/submissions", response_model=list[SubmissionResponse])
def get_assignment_submissions(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Teacher views all student submissions for a specific assignment."""
    assignment = db.query(Assignment).filter(Assignment.id == id).first()
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found.")

    subs = (
        db.query(Submission)
        .filter(Submission.assignment_id == id)
        .order_by(Submission.submitted_at.desc())
        .all()
    )
    return [map_submission_response(s) for s in subs]


@router.get("/api/submissions/{id}", response_model=SubmissionResponse)
def get_submission_by_id(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetch single submission. Access control: only owner student or teacher can access."""
    sub = db.query(Submission).filter(Submission.id == id).first()
    if not sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found.")

    # Authorization Check
    if current_user.role == "student" and sub.student_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You cannot view another student's submission."
        )

    return map_submission_response(sub)


@router.get("/api/submissions/{id}/download")
def download_submission_file(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Secure download endpoint for submitted assignment file.
    Validates user authentication and permissions before serving file stream from Cloud Object Storage.
    """
    sub = db.query(Submission).filter(Submission.id == id).first()
    if not sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found.")

    # Authorization Check
    if current_user.role == "student" and sub.student_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You cannot download another student's assignment."
        )

    file_path = storage_service.get_file_path(sub.storage_path)
    return FileResponse(
        path=str(file_path),
        filename=sub.file_name,
        media_type=sub.mime_type
    )


@router.get("/api/submissions/download-by-path")
def download_by_path(
    path: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Download helper supporting storage paths directly with authorization verification."""
    sub = db.query(Submission).filter(Submission.storage_path == path).first()
    if not sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File record not found.")

    if current_user.role == "student" and sub.student_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden access.")

    file_path = storage_service.get_file_path(sub.storage_path)
    return FileResponse(path=str(file_path), filename=sub.file_name, media_type=sub.mime_type)

