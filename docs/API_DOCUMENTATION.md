# REST API Specification

The **Cloud-Based Student Assignment Submission & Feedback Portal** exposes a standard RESTful API compliant with OpenAPI 3.0 standards. Interactive Swagger documentation is automatically hosted at `/docs` and ReDoc at `/redoc`.

---

## Authentication & Authorization Architecture

All protected endpoints require an `Authorization` header formatted as:
```http
Authorization: Bearer <JWT_ACCESS_TOKEN>
```

Tokens are signed using `HS256` with claims:
- `sub`: User UUID
- `role`: Role identifier (`student` | `teacher` | `admin`)
- `email`: User email address
- `name`: User display name
- `exp`: Expiration timestamp in UTC

---

## Endpoint Reference

### 1. Health & Cloud Probes

#### `GET /api/health`
Evaluates backend readiness, database connectivity, and cloud storage availability for Cloud Load Balancers.
- **Access:** Public
- **Response (200 OK):**
```json
{
  "status": "healthy",
  "app_name": "Cloud Assignment Submission Portal API",
  "version": "1.0.0",
  "storage_backend": "LocalBucketStore",
  "database": "Connected"
}
```

---

### 2. Authentication

#### `POST /api/auth/register`
Creates a new student account.
- **Access:** Public
- **Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@student.edu",
  "password": "Password@123",
  "role": "student"
}
```
- **Response (201 Created):**
```json
{
  "user": {
    "id": "c1f7a23b-...",
    "name": "Jane Doe",
    "email": "jane@student.edu",
    "role": "student"
  },
  "access_token": "eyJhbGciOi...",
  "token_type": "bearer"
}
```

#### `POST /api/auth/login`
Authenticates existing student or teacher and issues JWT.
- **Access:** Public
- **Request Body:**
```json
{
  "email": "teacher@university.edu",
  "password": "Teacher@123"
}
```
- **Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOi...",
  "token_type": "bearer",
  "user": {
    "id": "9a1d48c0-...",
    "name": "Prof. Alan Turing",
    "email": "teacher@university.edu",
    "role": "teacher"
  }
}
```

#### `GET /api/auth/me`
Retrieves current authenticated profile from token claims.
- **Access:** Bearer JWT required

---

### 3. Courses

#### `GET /api/courses`
Lists all courses.
- **Access:** Authenticated

#### `POST /api/courses`
Creates a new course.
- **Access:** Teacher / Admin role required

---

### 4. Assignments

#### `GET /api/assignments`
Lists active assignments with course details.
- **Access:** Authenticated

#### `GET /api/assignments/{id}`
Retrieves assignment details, rubric, and submission constraints.
- **Access:** Authenticated

#### `POST /api/assignments`
Publishes a new assignment.
- **Access:** Teacher role required
- **Request Body:**
```json
{
  "course_id": "b88c...",
  "title": "Cloud Object Storage & IAM Policy Lab",
  "description": "Implement S3 bucket policies and presigned URLs.",
  "deadline": "2026-10-15T23:59:59Z",
  "max_marks": 100,
  "allowed_extensions": [".pdf", ".docx", ".zip"],
  "max_file_size_mb": 10,
  "allow_late_submissions": true
}
```

---

### 5. Submissions & File Storage

#### `POST /api/assignments/{id}/submit`
Uploads coursework file to Cloud Object Storage and creates/updates submission metadata.
- **Access:** Student role required
- **Content-Type:** `multipart/form-data`
- **Form Data:**
  - `file`: Binary file upload
- **Response (201 Created):**
```json
{
  "id": "e2d8...",
  "assignment_id": "a1b2...",
  "student_id": "s3f4...",
  "file_name": "lab1_report.pdf",
  "storage_path": "assignments/a1b2.../s3f4.../lab1_report.pdf",
  "version": 1,
  "submitted_at": "2026-10-10T14:32:00Z",
  "submission_status": "SUBMITTED"
}
```

#### `GET /api/submissions/me`
Lists all submissions by the logged-in student across courses.
- **Access:** Student role required

#### `GET /api/assignments/{id}/submissions`
Lists all student submissions for an assignment.
- **Access:** Teacher role required

#### `GET /api/submissions/{id}/download`
Streams submitted document securely from Cloud Object Storage.
- **Access:** Authorized student (own submission) or instructor.

---

### 6. Grading & Feedback

#### `POST /api/submissions/{id}/grade`
Evaluates submission, records score and written remarks.
- **Access:** Teacher role required
- **Request Body:**
```json
{
  "marks": 95.0,
  "feedback": "Excellent architecture diagram and thorough security analysis."
}
```
- **Response (200 OK):**
```json
{
  "id": "e2d8...",
  "submission_status": "GRADED",
  "marks": 95.0,
  "feedback": "Excellent architecture diagram and thorough security analysis.",
  "graded_at": "2026-10-12T10:15:20Z"
}
```

---

### 7. Dashboard Analytics

#### `GET /api/dashboard/stats`
Returns aggregated analytical metrics:
- **For Students:** Total assignments, Pending, Submitted, Late, Graded, and recent feedback entries.
- **For Teachers:** Total coursework, Total student submissions, Pending review count, Graded count, and recent submission queue.
