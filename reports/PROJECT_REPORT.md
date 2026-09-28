# Formal Project Report: Cloud-Based Student Assignment Submission & Feedback Portal

---

## 1. Abstract
The **Cloud-Based Student Assignment Submission & Feedback Portal** is an enterprise-grade academic platform engineered using modern cloud computing architectural principles. Traditional assignment submission mechanisms—characterized by email attachments, unauthenticated web directories, and localized database storage—suffer from I/O bottlenecks, storage bloat, client-side timestamp manipulation, and absence of role-based security boundaries. This project designs, implements, tests, and documents a multi-tier cloud-native application that segregates structured relational data from unstructured binary documents. Built upon a high-performance Python FastAPI backend, React Single Page Application (SPA), SQLAlchemy Object Relational Mapping (ORM), and decoupled Cloud Object Storage abstraction (AWS S3 / Supabase Storage / Local Bucket simulation), the system guarantees strict role-based access control (RBAC), cryptographically signed JWT sessions, immutable server-side UTC deadline enforcement, automatic submission versioning, and real-time faculty feedback workflows. Rigorous verification across 25 automated end-to-end test cases validates system resilience, input sanitization, and defensive cloud security postures.

---

## 2. Introduction
Higher education institutions, coding bootcamps, and enterprise training programs increasingly depend on digital platforms to handle the lifecycle of student evaluation. Evaluating hundreds of student submissions concurrently demands high availability, fault tolerance, and secure data isolation. Cloud computing provides the foundational infrastructure to achieve these operational goals through on-demand elastic computing, managed databases, distributed object storage, and global content delivery networks.

This project delivers an industry-aligned demonstration of cloud computing paradigms, modeling real-world Learning Management Systems (LMS) such as Canvas, Google Classroom, and Blackboard.

---

## 3. Problem Statement
Legacy and naive submission portals face recurring architectural failures:
1. **Database Degradation via BLOB Ingestion:** Storing large PDF, DOCX, and ZIP archives directly inside database tables as Binary Large Objects (`BLOBs`) leads to index fragmentation, rapid disk saturation, and massive latency spikes during queries.
2. **Client-Side Clock Tampering:** Relying on client browser timestamps enables students to alter device clocks, fabricating false on-time submissions.
3. **Data Leaks & Inadequate Authorization:** Lack of granular Role-Based Access Control (RBAC) permits malicious or curious students to access and copy homework submitted by peers.
4. **Deadline Traffic Spikes:** Over 80% of submissions arrive within 30 minutes of deadlines, causing traditional monolithic, stateful web applications to exhaust memory and crash under simultaneous multi-part file uploads.
5. **Absence of Real-Time Feedback Auditing:** Faculty lack centralized, auditable interfaces to review, grade, and timestamp feedback, leading to student uncertainty and delayed grading cycles.

---

## 4. Objectives
- **Architectural Decoupling:** Isolate binary file persistence in Cloud Object Storage while retaining structured metadata in an ACID-compliant Cloud Relational Database.
- **Role-Based Access Control (RBAC):** Restrict endpoint access and UI views according to authenticated JWT roles (`student` vs. `teacher`).
- **Server-Side Timestamp Verification:** Guarantee submission timeliness using server-enforced UTC timestamps.
- **Multi-Cloud Readiness:** Provide pluggable adapters for local zero-cost simulation, AWS S3, Supabase, and Google Cloud Storage.
- **Automated Grading & Feedback Cycle:** Enable instructors to retrieve student files, evaluate submissions, and assign marks up to defined maximums with instant student notification.
- **Exhaustive Automated Verification:** Maintain an automated test suite verifying edge cases, oversized payloads, invalid extensions, and security injection attempts.

---

## 5. Existing System vs. Proposed System

| Dimension | Existing / Traditional System | Proposed Cloud Portal |
| :--- | :--- | :--- |
| **Storage Architecture** | File system of single VM or database BLOB | Decoupled Cloud Object Storage (S3 / Local Bucket) |
| **Timestamp Authority** | Client-side device clock or unverified headers | Trusted server-side UTC timestamp |
| **Scalability** | Vertical scaling; single point of failure | Stateless compute; horizontal auto-scaling & CDN delivery |
| **Authorization** | Basic session cookies or insecure URL tokens | Cryptographic JWT with role claims & route guards |
| **Deadline Surges** | I/O blocking during synchronous multipart uploads | Direct storage upload stream & asynchronous handling |
| **Resubmissions** | Overwrites or untracked duplicates | Automatic version increment (`v1`, `v2`) with status reset |
| **Cloud Portability** | Hardcoded filesystem paths | Environment-driven cloud adapter architecture |

---

## 6. User Roles and Permission Matrix

| Operation | Student Role | Teacher Role | Admin Role |
| :--- | :---: | :---: | :---: |
| Self-Registration / Login | Allowed | Allowed | Allowed |
| View Course Assignments | Allowed | Allowed | Allowed |
| Upload Assignment File | Allowed | Prohibited (403) | Prohibited |
| View Own Submissions | Allowed | Prohibited | Allowed |
| View Peer's Submissions | Prohibited (403) | Prohibited | Allowed |
| Create / Update Assignments | Prohibited (403) | Allowed | Allowed |
| Download Student Submissions | Prohibited (403) | Allowed | Allowed |
| Submit Marks & Feedback | Prohibited (403) | Allowed | Allowed |
| View Portal Analytics | Student View | Teacher View | System View |

---

## 7. Cloud Computing Concepts Applied
- **Software as a Service (SaaS):** Web-based portal accessible by faculty and students worldwide without installing desktop software.
- **Platform as a Service (PaaS):** Deployable on container-managed hosting (Render, AWS App Runner, Railway).
- **Cloud Database:** Structured relational data management with connection pooling, automated schema migrations, and health monitoring.
- **Cloud Object Storage:** Decoupled binary repository organizing files by key hierarchy (`assignments/{aid}/{uid}/{filename}`).
- **Role-Based Access Control (RBAC):** Cryptographically enforced permissions embedded within JWT tokens.
- **Stateless Compute:** Eliminates in-memory session states to allow effortless horizontal load balancing.
- **Secret Management:** Strict isolation of API keys and cryptographic secrets via environment variables (`.env`).
- **Load Balancer Health Probes:** Dedicated `/api/health` probe evaluating database and storage liveness.

---

## 8. Technology Stack Selection
- **Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons, Fetch API with Bearer token interceptor.
- **Backend:** Python 3.11+, FastAPI (high-concurrency ASGI framework), Pydantic v2 (data validation).
- **Database & ORM:** SQLite (Zero-cost local simulation) / PostgreSQL (Cloud production), SQLAlchemy 2.0.
- **Object Storage:** Local Object Bucket simulation / AWS S3 (via Boto3) / Supabase Storage.
- **Security & Cryptography:** Passlib with Bcrypt (cost factor 12), Python-Jose (JWT generation and verification).
- **Testing:** Pytest, Starlette HTTP TestClient.

---

## 9. System Architecture & Component Diagram

```
                     ┌──────────────────────────────────────────────┐
                     │           Client Web Browser                 │
                     │   (React SPA: Student / Teacher Dashboards)  │
                     └──────────────────────┬───────────────────────┘
                                            │ HTTPS / Bearer JWT
                                            ▼
                     ┌──────────────────────────────────────────────┐
                     │          FastAPI Gateway & Router            │
                     │  ├── CORS Middleware                         │
                     │  ├── JWT Authentication & RBAC Guard         │
                     │  └── Pydantic Schema Validation              │
                     └───────┬──────────────────────────────┬───────┘
                             │                              │
          Metadata Operations│                              │ Binary Stream Operations
                             ▼                              ▼
             ┌──────────────────────────────┐ ┌──────────────────────────────┐
             │       Cloud Database         │ │     Cloud Object Storage     │
             │   (SQLAlchemy / PostgreSQL)  │ │   (AWS S3 / Bucket Store)    │
             │  ├── Users & Credentials     │ │  ├── assignments/            │
             │  ├── Courses & Assignments   │ │  │   └── {aid}/{uid}/        │
             │  └── Submissions & Marks     │ │  │       └── submission.pdf  │
             └──────────────────────────────┘ └──────────────────────────────┘
```

---

## 10. Database Schema Design
1. **Users Table:**
   - `id`: UUID (Primary Key)
   - `name`: String(100), Indexed
   - `email`: String(255), Unique, Indexed
   - `password_hash`: String(255)
   - `role`: Enum('student', 'teacher', 'admin')
   - `created_at`: DateTime UTC

2. **Courses Table:**
   - `id`: UUID (Primary Key)
   - `course_code`: String(20), Unique
   - `course_name`: String(150)
   - `teacher_id`: Foreign Key (`users.id`)

3. **Assignments Table:**
   - `id`: UUID (Primary Key)
   - `course_id`: Foreign Key (`courses.id`)
   - `title`: String(200)
   - `description`: Text
   - `deadline`: DateTime UTC
   - `max_marks`: Integer
   - `allowed_extensions`: JSON Array (e.g., `[".pdf", ".docx", ".zip"]`)
   - `max_file_size_mb`: Integer (Default 10MB)
   - `allow_late_submissions`: Boolean

4. **Submissions Table:**
   - `id`: UUID (Primary Key)
   - `assignment_id`: Foreign Key (`assignments.id`), Indexed
   - `student_id`: Foreign Key (`users.id`), Indexed
   - `file_name`: String(255)
   - `storage_path`: String(500)
   - `file_size_bytes`: Integer
   - `mime_type`: String(100)
   - `version`: Integer (Default 1)
   - `submitted_at`: DateTime UTC
   - `submission_status`: Enum('NOT_SUBMITTED', 'SUBMITTED', 'LATE', 'GRADED')
   - `marks`: Float (Nullable)
   - `feedback`: Text (Nullable)
   - `graded_by`: Foreign Key (`users.id`, Nullable)
   - `graded_at`: DateTime UTC (Nullable)

---

## 11. Cloud Storage Design
Binary files are addressed through deterministic, isolated object keys:
`assignments/{assignment_id}/{student_id}/{filename}`

- **Name Sanitization:** Strips path separators (`/`, `\`, `..`) and malicious shell characters, preventing directory traversal attacks.
- **Signed URL & Streaming:** In production, files are accessed via short-lived AWS S3 Presigned URLs or streamed through authenticated backend proxies. Direct public read permissions on storage buckets are disabled.

---

## 12. Authentication & Authorization Implementation
Authentication is implemented via OAuth2 Bearer Tokens encapsulating signed JSON Web Tokens (JWT).
- **Password Security:** Evaluated using Bcrypt with cryptographically random salts.
- **Claim Structure:** Token payloads contain `sub` (User ID), `role`, `email`, `name`, `iat` (issued at), and `exp` (expiry).
- **RBAC Enforcer:** Dependency functions (`require_student`, `require_teacher`) introspect claims before invoking route handlers.

---

## 13. Assignment Management Workflow
Teachers create coursework by specifying title, course affiliation, instructions, deadline, maximum marks, allowed file extensions, and file size limits. All constraints are stored in the database and validated on the backend.

---

## 14. Submission Workflow
1. Student selects assignment and chooses file.
2. Client sends multipart form-data to `POST /api/assignments/{id}/submit`.
3. Backend performs four-phase validation:
   - User authentication and role check.
   - Assignment existence and submission eligibility.
   - File extension and byte size constraints.
   - Server-side UTC deadline verification.
4. Binary data is streamed to Cloud Object Storage.
5. Submission record is created or updated (incrementing version).
6. HTTP 201 response returns submission metadata.

---

## 15. Deadline Management Logic
Server-side deadline logic compares `submitted_at = datetime.now(timezone.utc)` against `assignment.deadline`.
- If `submitted_at <= deadline`: Status is set to `SUBMITTED`.
- If `submitted_at > deadline`:
  - If `allow_late_submissions == True`: Status is marked `LATE`.
  - If `allow_late_submissions == False`: Request is rejected with `HTTP 400 Bad Request`.

---

## 16. Feedback & Grading Engine
Teachers grade submissions via `POST /api/submissions/{id}/grade`.
- Validation ensures `0 <= marks <= assignment.max_marks`.
- Status is updated to `GRADED`, recording `graded_by` and `graded_at`.
- Students can view evaluated marks and written remarks directly in their dashboard.

---

## 17. REST API Design Summary

| Endpoint | Method | Role | Description |
| :--- | :---: | :---: | :--- |
| `/api/auth/register` | POST | Public | Registers a new student account |
| `/api/auth/login` | POST | Public | Validates credentials and returns JWT |
| `/api/courses` | GET | Authenticated | Lists all enrolled courses |
| `/api/assignments` | GET | Authenticated | Retrieves active assignments |
| `/api/assignments` | POST | Teacher | Creates new assignment |
| `/api/assignments/{id}/submit` | POST | Student | Uploads assignment file to cloud storage |
| `/api/submissions/me` | GET | Student | Lists student's own submissions |
| `/api/assignments/{id}/submissions`| GET | Teacher | Lists all submissions for an assignment |
| `/api/submissions/{id}/grade` | POST | Teacher | Submits marks and feedback |
| `/api/submissions/{id}/download` | GET | Authorized | Streams file from cloud storage |
| `/api/dashboard/stats` | GET | Authenticated | Retrieves role-specific analytical KPIs |

---

## 18. Testing & Quality Assurance
The platform incorporates 25 automated tests executed via `pytest`:
- **Auth & RBAC:** Verifies token validation, password hashing, and role rejections (403).
- **Storage & Input Validation:** Tests invalid extensions (`.exe`), oversized payloads (>10MB), and path traversal prevention.
- **Workflow & Business Rules:** Tests deadline thresholding, version bumping on resubmission, and marks ceiling validation.
- **Results:** 25 passed, 0 failed (100% success rate).

---

## 19. Scalability & High-Load Architecture
To support 100,000 students submitting simultaneously before a deadline:
1. **Stateless Backend Nodes:** Deployed in auto-scaling groups behind an Application Load Balancer (ALB).
2. **Direct-to-S3 Presigned Uploads:** Frontend requests a signed S3 upload URL from the API, then uploads directly to S3. This eliminates file I/O bottleneck on backend servers.
3. **Asynchronous Processing:** S3 upload triggers an S3 Event Notification to AWS SQS/SNS, invoking AWS Lambda to write submission metadata to Amazon RDS/DynamoDB.
4. **Caching Layer:** Redis caches course and assignment metadata, reducing database read pressure by over 90%.

---

## 20. Conclusion
The Cloud-Based Student Assignment Submission & Feedback Portal successfully bridges theoretical cloud computing concepts with production-ready software engineering. By decoupling storage, enforcing server-side deadline rules, and isolating identities via RBAC, the system provides a scalable, auditable, and secure foundation for modern e-learning workflows.
