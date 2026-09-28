import io
import pytest
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app import app
from backend.config import settings
from backend.database.db import Base, get_db
from backend.database.models import User, Course, Assignment, Submission
from backend.services.auth_service import hash_password

# Use an isolated in-memory or test SQLite database
TEST_DB_URL = "sqlite:///./test_portal.db"
test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    
    # Pre-seed one teacher and one student for testing
    db = TestingSessionLocal()
    teacher = User(
        id="teacher-uuid-1",
        name="Prof. Turing Test",
        email="test_teacher@university.edu",
        password_hash=hash_password("TeacherPass123"),
        role="teacher"
    )
    student1 = User(
        id="student-uuid-1",
        name="Alice Student",
        email="test_alice@student.edu",
        password_hash=hash_password("AlicePass123"),
        role="student"
    )
    student2 = User(
        id="student-uuid-2",
        name="Bob Student",
        email="test_bob@student.edu",
        password_hash=hash_password("BobPass123"),
        role="student"
    )
    course = Course(
        id="course-uuid-1",
        course_code="CLOUD101",
        course_name="Introduction to Cloud Architecture",
        teacher_id=teacher.id
    )
    db.add_all([teacher, student1, student2, course])
    db.commit()
    db.close()
    yield
    Base.metadata.drop_all(bind=test_engine)


# Helper tokens
def get_auth_token(email: str, password: str) -> str:
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, res.text
    return res.json()["access_token"]


# ==========================================
# 25 TEST CASES AS SPECIFIED IN REQUIREMENT
# ==========================================

# Test 1: Student registration
def test_01_student_registration():
    res = client.post("/api/auth/register", json={
        "name": "Charlie Brown",
        "email": "charlie@student.edu",
        "password": "Password123!",
        "role": "student"
    })
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "charlie@student.edu"
    assert data["user"]["role"] == "student"


# Test 2: Teacher login
def test_02_teacher_login():
    res = client.post("/api/auth/login", json={
        "email": "test_teacher@university.edu",
        "password": "TeacherPass123"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["role"] == "teacher"


# Test 3: Invalid login
def test_03_invalid_login():
    res = client.post("/api/auth/login", json={
        "email": "test_teacher@university.edu",
        "password": "WrongPassword!!!"
    })
    assert res.status_code == 401
    assert "Invalid email or password" in res.json()["detail"]


# Test 4: Student dashboard authorization
def test_04_student_dashboard_auth():
    token = get_auth_token("test_alice@student.edu", "AlicePass123")
    res = client.get("/api/dashboard/student", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert "total_assignments" in data
    assert "pending_assignments" in data


# Test 5: Teacher dashboard authorization (student forbidden)
def test_05_teacher_dashboard_authorization():
    # Student attempts to access teacher dashboard -> Must be 403 Forbidden
    student_token = get_auth_token("test_alice@student.edu", "AlicePass123")
    res_forbidden = client.get("/api/dashboard/teacher", headers={"Authorization": f"Bearer {student_token}"})
    assert res_forbidden.status_code == 403

    # Teacher accesses teacher dashboard -> Must be 200 OK
    teacher_token = get_auth_token("test_teacher@university.edu", "TeacherPass123")
    res_ok = client.get("/api/dashboard/teacher", headers={"Authorization": f"Bearer {teacher_token}"})
    assert res_ok.status_code == 200
    assert "total_students" in res_ok.json()


# Test 6: Teacher creates assignment
assignment_state = {}
def test_06_teacher_creates_assignment():
    token = get_auth_token("test_teacher@university.edu", "TeacherPass123")
    deadline = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
    res = client.post("/api/assignments", json={
        "course_id": "course-uuid-1",
        "title": "Cloud S3 Storage Hands-on",
        "description": "Configure S3 bucket policies and presigned URLs.",
        "deadline": deadline,
        "max_marks": 100.0,
        "allowed_extensions": ".pdf,.docx,.zip",
        "max_file_size_mb": 15,
        "allow_late_submissions": True
    }, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 201
    data = res.json()
    assignment_state["id"] = data["id"]
    assert data["title"] == "Cloud S3 Storage Hands-on"


# Test 7: Student views assignment
def test_07_student_views_assignment():
    token = get_auth_token("test_alice@student.edu", "AlicePass123")
    res = client.get(f"/api/assignments/{assignment_state['id']}", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == assignment_state["id"]
    assert data["submission_status"] == "NOT_SUBMITTED"


# Test 8: Valid PDF upload
def test_08_valid_pdf_upload():
    token = get_auth_token("test_alice@student.edu", "AlicePass123")
    pdf_content = b"%PDF-1.4 Mock Assignment Solution Document for Alice"
    files = {"file": ("alice_solution.pdf", io.BytesIO(pdf_content), "application/pdf")}
    res = client.post(
        f"/api/assignments/{assignment_state['id']}/submit",
        files=files,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 201
    data = res.json()
    assignment_state["alice_submission_id"] = data["id"]
    assert data["submission_status"] in ["SUBMITTED", "LATE"]
    assert data["file_name"] == "alice_solution.pdf"


# Test 9: Invalid file extension rejected
def test_09_invalid_file_extension():
    token = get_auth_token("test_alice@student.edu", "AlicePass123")
    script_content = b"#!/bin/bash\necho hack"
    files = {"file": ("malicious_script.sh", io.BytesIO(script_content), "text/x-sh")}
    res = client.post(
        f"/api/assignments/{assignment_state['id']}/submit",
        files=files,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 400
    assert "Unsupported file format" in res.json()["detail"]


# Test 10: Oversized file rejected
def test_10_oversized_file_rejected():
    token = get_auth_token("test_alice@student.edu", "AlicePass123")
    # assignment limit is 15 MB -> generate 16 MB mock stream
    large_bytes = b"0" * (16 * 1024 * 1024)
    files = {"file": ("huge_file.pdf", io.BytesIO(large_bytes), "application/pdf")}
    res = client.post(
        f"/api/assignments/{assignment_state['id']}/submit",
        files=files,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 413
    assert "exceeds maximum allowed size" in res.json()["detail"]


# Test 11: On-time submission
def test_11_on_time_submission():
    # The assignment deadline was set 7 days in the future, so Alice's submission is on-time
    sub_id = assignment_state["alice_submission_id"]
    token = get_auth_token("test_alice@student.edu", "AlicePass123")
    res = client.get(f"/api/submissions/{sub_id}", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["submission_status"] == "SUBMITTED"


# Test 12: Late submission
def test_12_late_submission():
    teacher_token = get_auth_token("test_teacher@university.edu", "TeacherPass123")
    # Create past-due assignment with allow_late_submissions = True
    past_deadline = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
    res_a = client.post("/api/assignments", json={
        "course_id": "course-uuid-1",
        "title": "Past Due Assignment",
        "description": "Testing late submission status",
        "deadline": past_deadline,
        "max_marks": 50.0,
        "allow_late_submissions": True
    }, headers={"Authorization": f"Bearer {teacher_token}"})
    assert res_a.status_code == 201
    late_assign_id = res_a.json()["id"]

    # Student submits -> Must be marked 'LATE'
    student_token = get_auth_token("test_bob@student.edu", "BobPass123")
    files = {"file": ("bob_late.pdf", io.BytesIO(b"%PDF-1.4 Bob late submission"), "application/pdf")}
    res_sub = client.post(f"/api/assignments/{late_assign_id}/submit", files=files, headers={"Authorization": f"Bearer {student_token}"})
    assert res_sub.status_code == 201
    assert res_sub.json()["submission_status"] == "LATE"


# Test 13: Resubmission
def test_13_resubmission():
    token = get_auth_token("test_alice@student.edu", "AlicePass123")
    # Alice uploads version 2 of her solution
    v2_content = b"%PDF-1.4 Alice Revised Solution V2"
    files = {"file": ("alice_solution_v2.pdf", io.BytesIO(v2_content), "application/pdf")}
    res = client.post(
        f"/api/assignments/{assignment_state['id']}/submit",
        files=files,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 201
    data = res.json()
    assert data["version"] == 2
    assert "v2" in data["file_name"]


# Test 14: Student views own submission
def test_14_student_views_own_submission():
    token = get_auth_token("test_alice@student.edu", "AlicePass123")
    res = client.get("/api/submissions/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    subs = res.json()
    assert len(subs) >= 1
    assert any(s["student_id"] == "student-uuid-1" for s in subs)


# Test 15: Student cannot view another student's submission (Forbidden 403)
def test_15_student_cross_access_prevented():
    bob_token = get_auth_token("test_bob@student.edu", "BobPass123")
    alice_sub_id = assignment_state["alice_submission_id"]
    res = client.get(f"/api/submissions/{alice_sub_id}", headers={"Authorization": f"Bearer {bob_token}"})
    assert res.status_code == 403
    assert "Forbidden" in res.json()["detail"]


# Test 16: Teacher views submissions
def test_16_teacher_views_submissions():
    token = get_auth_token("test_teacher@university.edu", "TeacherPass123")
    res = client.get(f"/api/assignments/{assignment_state['id']}/submissions", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    subs = res.json()
    assert len(subs) >= 1
    assert subs[0]["student_name"] == "Alice Student"


# Test 17: Teacher grades submission
def test_17_teacher_grades_submission():
    token = get_auth_token("test_teacher@university.edu", "TeacherPass123")
    alice_sub_id = assignment_state["alice_submission_id"]
    res = client.post(f"/api/submissions/{alice_sub_id}/grade", json={
        "marks": 94.5,
        "feedback": "Great use of AWS S3 IAM bucket policies and signed URLs!"
    }, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["submission_status"] == "GRADED"
    assert data["marks"] == 94.5
    assert "Great use" in data["feedback"]


# Test 18: Marks above maximum rejected
def test_18_marks_above_maximum_rejected():
    token = get_auth_token("test_teacher@university.edu", "TeacherPass123")
    alice_sub_id = assignment_state["alice_submission_id"]
    # Max marks is 100.0; send 105.0 -> Must be 400 Bad Request
    res = client.post(f"/api/submissions/{alice_sub_id}/grade", json={
        "marks": 105.0,
        "feedback": "Impossible bonus"
    }, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 400
    assert "cannot exceed maximum" in res.json()["detail"]


# Test 19: Student views feedback
def test_19_student_views_feedback():
    token = get_auth_token("test_alice@student.edu", "AlicePass123")
    alice_sub_id = assignment_state["alice_submission_id"]
    res = client.get(f"/api/submissions/{alice_sub_id}/feedback", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["marks"] == 94.5
    assert data["feedback"] is not None
    assert data["submission_status"] == "GRADED"


# Test 20: Unauthorized grading rejected
def test_20_unauthorized_grading_rejected():
    student_token = get_auth_token("test_alice@student.edu", "AlicePass123")
    alice_sub_id = assignment_state["alice_submission_id"]
    res = client.post(f"/api/submissions/{alice_sub_id}/grade", json={
        "marks": 100.0,
        "feedback": "I am giving myself full marks"
    }, headers={"Authorization": f"Bearer {student_token}"})
    assert res.status_code == 403


# Test 21: File retrieval
def test_21_file_retrieval():
    token = get_auth_token("test_alice@student.edu", "AlicePass123")
    alice_sub_id = assignment_state["alice_submission_id"]
    res = client.get(f"/api/submissions/{alice_sub_id}/download", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert b"%PDF-1.4" in res.content


# Test 22: Storage path traversal protection / Missing file handling
def test_22_storage_security_and_missing_handling():
    token = get_auth_token("test_teacher@university.edu", "TeacherPass123")
    res = client.get("/api/submissions/download-by-path?path=../../etc/passwd", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code in [400, 404]


# Test 23: Database entity not found handling
def test_23_database_not_found():
    token = get_auth_token("test_alice@student.edu", "AlicePass123")
    res = client.get("/api/submissions/non-existent-uuid-9999", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()


# Test 24: Logout endpoint
def test_24_logout():
    token = get_auth_token("test_alice@student.edu", "AlicePass123")
    res = client.post("/api/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert "Logged out successfully" in res.json()["message"]


# Test 25: Protected route rejection without token
def test_25_protected_route_rejection():
    res = client.get("/api/auth/me")
    assert res.status_code == 401
    assert "Authentication credentials were not provided" in res.json()["detail"]
