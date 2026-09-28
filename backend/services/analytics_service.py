from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.database.models import User, Course, Assignment, Submission

def get_student_dashboard_metrics(student_id: str, db: Session) -> dict:
    """Computes real-time KPI metrics and lists for the Student Dashboard."""
    now = datetime.now(timezone.utc)
    
    # All assignments available across courses
    assignments = db.query(Assignment).order_by(Assignment.deadline.asc()).all()
    total_assignments = len(assignments)

    # Submissions made by this student
    my_submissions = (
        db.query(Submission)
        .filter(Submission.student_id == student_id)
        .order_by(Submission.submitted_at.desc())
        .all()
    )
    
    submitted_ids = {s.assignment_id for s in my_submissions}
    
    submitted_count = len(my_submissions)
    pending_count = max(0, total_assignments - len(submitted_ids))
    late_count = sum(1 for s in my_submissions if s.submission_status == "LATE")
    graded_count = sum(1 for s in my_submissions if s.submission_status == "GRADED")

    # Upcoming deadlines (assignments not yet submitted, sorted by closest deadline)
    upcoming_deadlines = []
    for a in assignments:
        # Check if student has submitted
        sub = next((s for s in my_submissions if s.assignment_id == a.id), None)
        status_val = sub.submission_status if sub else "NOT_SUBMITTED"
        upcoming_deadlines.append({
            "id": a.id,
            "course_id": a.course_id,
            "course_code": a.course.course_code if a.course else "",
            "course_name": a.course.course_name if a.course else "",
            "title": a.title,
            "description": a.description,
            "deadline": a.deadline,
            "max_marks": a.max_marks,
            "allowed_extensions": a.allowed_extensions,
            "max_file_size_mb": a.max_file_size_mb,
            "allow_late_submissions": a.allow_late_submissions,
            "created_by": a.created_by,
            "creator_name": a.creator.name if a.creator else "",
            "created_at": a.created_at,
            "submission_status": status_val,
            "my_submission_id": sub.id if sub else None,
            "my_marks": sub.marks if sub else None,
            "my_feedback": sub.feedback if sub else None,
            "my_submitted_at": sub.submitted_at if sub else None
        })

    # Recent feedback (submissions with marks/feedback)
    recent_feedback = []
    for s in my_submissions:
        if s.marks is not None or s.feedback:
            recent_feedback.append({
                "id": s.id,
                "assignment_id": s.assignment_id,
                "assignment_title": s.assignment.title if s.assignment else "Assignment",
                "course_code": s.assignment.course.course_code if s.assignment and s.assignment.course else "",
                "student_id": s.student_id,
                "student_name": s.student.name if s.student else "",
                "student_email": s.student.email if s.student else "",
                "file_name": s.file_name,
                "file_url": s.file_url,
                "storage_path": s.storage_path,
                "file_size_bytes": s.file_size_bytes,
                "mime_type": s.mime_type,
                "version": s.version,
                "submitted_at": s.submitted_at,
                "submission_status": s.submission_status,
                "marks": s.marks,
                "max_marks": s.assignment.max_marks if s.assignment else 100.0,
                "feedback": s.feedback,
                "graded_by": s.graded_by,
                "grader_name": s.grader.name if s.grader else "Instructor",
                "graded_at": s.graded_at
            })

    return {
        "total_assignments": total_assignments,
        "pending_assignments": pending_count,
        "submitted_assignments": submitted_count,
        "late_assignments": late_count,
        "graded_assignments": graded_count,
        "upcoming_deadlines": upcoming_deadlines,
        "recent_feedback": recent_feedback[:10]
    }


def get_teacher_dashboard_metrics(teacher_id: str, db: Session) -> dict:
    """Computes real-time KPI metrics and lists for the Teacher Dashboard."""
    # Assignments created by this teacher
    assignments = db.query(Assignment).filter(Assignment.created_by == teacher_id).order_by(Assignment.deadline.asc()).all()
    assignment_ids = [a.id for a in assignments]
    
    total_assignments = len(assignments)
    
    # Total unique students who registered
    total_students = db.query(User).filter(User.role == "student").count()
    
    # Submissions for teacher's assignments
    submissions = (
        db.query(Submission)
        .filter(Submission.assignment_id.in_(assignment_ids) if assignment_ids else False)
        .order_by(Submission.submitted_at.desc())
        .all()
    )
    
    total_submissions = len(submissions)
    graded_submissions = sum(1 for s in submissions if s.submission_status == "GRADED")
    pending_reviews = total_submissions - graded_submissions
    late_submissions = sum(1 for s in submissions if s.submission_status == "LATE" or (s.submission_status == "GRADED" and s.marks is not None and s.submitted_at > s.assignment.deadline))

    recent_submissions = []
    for s in submissions[:15]:
        recent_submissions.append({
            "id": s.id,
            "assignment_id": s.assignment_id,
            "assignment_title": s.assignment.title if s.assignment else "Assignment",
            "course_code": s.assignment.course.course_code if s.assignment and s.assignment.course else "",
            "student_id": s.student_id,
            "student_name": s.student.name if s.student else "",
            "student_email": s.student.email if s.student else "",
            "file_name": s.file_name,
            "file_url": s.file_url,
            "storage_path": s.storage_path,
            "file_size_bytes": s.file_size_bytes,
            "mime_type": s.mime_type,
            "version": s.version,
            "submitted_at": s.submitted_at,
            "submission_status": s.submission_status,
            "marks": s.marks,
            "max_marks": s.assignment.max_marks if s.assignment else 100.0,
            "feedback": s.feedback,
            "graded_by": s.graded_by,
            "grader_name": s.grader.name if s.grader else None,
            "graded_at": s.graded_at
        })

    upcoming = []
    for a in assignments:
        upcoming.append({
            "id": a.id,
            "course_id": a.course_id,
            "course_code": a.course.course_code if a.course else "",
            "course_name": a.course.course_name if a.course else "",
            "title": a.title,
            "description": a.description,
            "deadline": a.deadline,
            "max_marks": a.max_marks,
            "allowed_extensions": a.allowed_extensions,
            "max_file_size_mb": a.max_file_size_mb,
            "allow_late_submissions": a.allow_late_submissions,
            "created_by": a.created_by,
            "creator_name": a.creator.name if a.creator else "",
            "created_at": a.created_at,
            "submission_status": "TEACHER_VIEW",
            "my_submission_id": None,
            "my_marks": None,
            "my_feedback": None,
            "my_submitted_at": None
        })

    return {
        "total_assignments": total_assignments,
        "total_students": total_students,
        "total_submissions": total_submissions,
        "pending_reviews": pending_reviews,
        "late_submissions": late_submissions,
        "graded_submissions": graded_submissions,
        "recent_submissions": recent_submissions,
        "upcoming_deadlines": upcoming
    }
