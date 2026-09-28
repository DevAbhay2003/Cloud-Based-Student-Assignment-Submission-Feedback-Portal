import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from sqlalchemy.orm import Session
from backend.database.db import engine, Base, SessionLocal
from backend.database.models import User, Course, Assignment, Submission
from backend.services.auth_service import hash_password
from backend.config import settings

def seed_database():
    print("[*] Initializing database schema...")
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # Check if already seeded
        existing_teacher = db.query(User).filter(User.email == "teacher@university.edu").first()
        if existing_teacher:
            print("[+] Database already initialized with dummy data.")
            return

        print("[*] Seeding realistic cloud portal demo data...")
        now = datetime.now(timezone.utc)

        # 1. Teachers & Students
        teacher = User(
            name="Prof. Alan Turing",
            email="teacher@university.edu",
            password_hash=hash_password("Teacher@123"),
            role="teacher"
        )
        student_alice = User(
            name="Alice Smith",
            email="alice@student.edu",
            password_hash=hash_password("Student@123"),
            role="student"
        )
        student_bob = User(
            name="Bob Jones",
            email="bob@student.edu",
            password_hash=hash_password("Student@123"),
            role="student"
        )
        db.add_all([teacher, student_alice, student_bob])
        db.commit()
        db.refresh(teacher)
        db.refresh(student_alice)
        db.refresh(student_bob)

        # 2. Courses
        course_cs101 = Course(
            course_code="CS101",
            course_name="Cloud Computing Architecture & Systems",
            teacher_id=teacher.id
        )
        course_cs202 = Course(
            course_code="CS202",
            course_name="Distributed Database Systems & Storage",
            teacher_id=teacher.id
        )
        db.add_all([course_cs101, course_cs202])
        db.commit()
        db.refresh(course_cs101)
        db.refresh(course_cs202)

        # 3. Assignments
        assignment_1 = Assignment(
            course_id=course_cs101.id,
            title="Lab 1: Deploying a Multi-Tier Cloud Application",
            description="Build a containerized REST API with an external managed database and static CDN frontend. Submit architecture diagram and deployment documentation.",
            deadline=now + timedelta(days=5),
            max_marks=100.0,
            allowed_extensions=".pdf,.docx,.zip",
            max_file_size_mb=25,
            allow_late_submissions=True,
            created_by=teacher.id
        )
        assignment_2 = Assignment(
            course_id=course_cs101.id,
            title="Lab 2: Object Storage & S3 Bucket Lifecycle Rules",
            description="Configure automated replication, access control lists (ACLs), and retention policies for enterprise cloud backups. Provide test logs in PDF.",
            deadline=now + timedelta(days=12),
            max_marks=100.0,
            allowed_extensions=".pdf,.docx,.zip",
            max_file_size_mb=25,
            allow_late_submissions=True,
            created_by=teacher.id
        )
        assignment_3 = Assignment(
            course_id=course_cs202.id,
            title="Homework 1: Database Sharding & Replication Theory",
            description="Explain CAP theorem trade-offs when designing globally distributed NoSQL databases versus ACID-compliant relational databases.",
            deadline=now - timedelta(days=2),  # Past deadline to demonstrate LATE / past-due logic
            max_marks=50.0,
            allowed_extensions=".pdf,.docx,.txt",
            max_file_size_mb=10,
            allow_late_submissions=True,
            created_by=teacher.id
        )
        db.add_all([assignment_1, assignment_2, assignment_3])
        db.commit()
        db.refresh(assignment_1)
        db.refresh(assignment_2)
        db.refresh(assignment_3)

        # 4. Create sample storage files on disk in the storage bucket
        bucket_dir = Path(settings.STORAGE_BUCKET_PATH)
        alice_storage_path = f"assignments/{assignment_1.id}/{student_alice.id}/v1_alice_cloud_lab1.pdf"
        bob_storage_path = f"assignments/{assignment_1.id}/{student_bob.id}/v1_bob_cloud_lab1.pdf"

        full_alice_file = bucket_dir / alice_storage_path
        full_bob_file = bucket_dir / bob_storage_path
        full_alice_file.parent.mkdir(parents=True, exist_ok=True)
        full_bob_file.parent.mkdir(parents=True, exist_ok=True)

        sample_pdf_bytes = b"%PDF-1.4\n1 0 obj\n<< /Title (Student Cloud Submission) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF"
        full_alice_file.write_bytes(sample_pdf_bytes)
        full_bob_file.write_bytes(sample_pdf_bytes)

        # 5. Create Submissions in database
        sub_alice = Submission(
            assignment_id=assignment_1.id,
            student_id=student_alice.id,
            file_name="alice_cloud_lab1.pdf",
            file_url=f"/api/submissions/download-by-path?path={alice_storage_path}",
            storage_path=alice_storage_path,
            file_size_bytes=len(sample_pdf_bytes),
            mime_type="application/pdf",
            version=1,
            submitted_at=now - timedelta(days=1),
            submission_status="GRADED",
            marks=96.5,
            feedback="Outstanding architecture design! Clean modular microservices separation and thorough documentation of security controls.",
            graded_by=teacher.id,
            graded_at=now - timedelta(hours=6)
        )
        sub_bob = Submission(
            assignment_id=assignment_1.id,
            student_id=student_bob.id,
            file_name="bob_cloud_lab1.pdf",
            file_url=f"/api/submissions/download-by-path?path={bob_storage_path}",
            storage_path=bob_storage_path,
            file_size_bytes=len(sample_pdf_bytes),
            mime_type="application/pdf",
            version=1,
            submitted_at=now - timedelta(hours=3),
            submission_status="SUBMITTED",
            marks=None,
            feedback=None,
            graded_by=None,
            graded_at=None
        )
        db.add_all([sub_alice, sub_bob])
        db.commit()

        print("[+] Dummy data successfully seeded:")
        print("    Teacher: teacher@university.edu (Pass: Teacher@123)")
        print("    Student 1: alice@student.edu (Pass: Student@123)")
        print("    Student 2: bob@student.edu (Pass: Student@123)")
        print("    Courses: CS101, CS202")
        print("    Assignments: 3 created with sample submissions & grades!")

    except Exception as e:
        db.rollback()
        print(f"[-] Error seeding database: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
