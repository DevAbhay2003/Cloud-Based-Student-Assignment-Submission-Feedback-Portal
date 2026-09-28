# Project Report: Cloud-Based Student Assignment Submission & Feedback Portal

## 1. Abstract
The **Cloud-Based Student Assignment Submission & Feedback Portal** is an end-to-end multi-tier educational platform engineered to resolve the bottlenecks associated with manual, fragmented assignment submission and evaluation workflows. Built using Python FastAPI, React, SQLAlchemy, and a decoupled Cloud Object Storage abstraction, this system separates structured relational data (users, courses, assignments, grades, timestamps) from large binary files (PDFs, DOCX, ZIP archives). The project emphasizes core Cloud Computing paradigms: storage decoupling, server-side deadline verification, role-based access control (RBAC), stateless API horizontal scalability, and defense against common cloud security vulnerabilities. Comprehensive test coverage (25 automated test cases) validates system reliability, security boundaries, and fault tolerance.

---

## 2. Introduction
In modern academic and corporate training ecosystems, digital assignment management is critical. Traditional approaches—such as email submissions, physical drives, or basic file upload web forms—suffer from lack of auditability, security loopholes, and performance degradation during peak deadline hours. This project provides a cloud-native platform that allows students to view coursework and upload assignments directly to cloud storage, while providing teachers with centralized interfaces to review submissions, grade student work, and publish constructive feedback in real time.

---

## 3. Problem Statement
1. **Inefficient Storage Architectures:** Directly inserting binary documents (BLOBs) into relational databases causes severe I/O bottlenecks and database bloat.
2. **Client-Side Clock Vulnerability:** When assignment submission deadlines rely on client browser timestamps, users can manipulate local device clocks to bypass deadlines.
3. **Privacy and Data Leaks:** Inadequate authorization often allows students to inspect or download other students' submitted documents.
4. **Deadline Traffic Surges:** University submission portals experience extreme 100x traffic spikes 15 minutes before deadlines, requiring a decoupled architecture that prevents application server exhaustion.

---

## 4. Objectives
- Develop a cloud-hosted, responsive portal with distinct Student and Teacher interfaces.
- Decouple metadata persistence from binary file storage using Cloud Object Storage patterns.
- Implement server-side UTC timestamp validation for deadline enforcement.
- Enforce strict Role-Based Access Control (RBAC) via JSON Web Tokens (JWT).
- Provide automated grading and feedback workflows with score boundary validation.
- Maintain 100% test coverage across 25 end-to-end test scenarios.

---

## 5. Existing System vs. Proposed System

| Parameter | Existing / Traditional System | Proposed Cloud Portal |
| :--- | :--- | :--- |
| **Storage Architecture** | Files stored on server local disk or as database BLOBs | Decoupled Cloud Object Storage (S3 / Bucket Store) |
| **Deadline Verification** | Client-side or unverified timestamps | Strict server-side UTC timestamp validation |
| **Scalability** | Stateful; monolithic servers bottleneck under upload loads | Stateless compute; horizontal auto-scaling & direct storage upload |
| **Privacy & Access** | Open URL paths or weak session checks | Cryptographic JWT claims and role guards (RBAC) |
| **Version History** | Overwrites or creates duplicate records | Automatic version tracking (`v1`, `v2`) with status reset |
| **Evaluation Speed** | Manual emails or spreadsheet records | Integrated real-time grading and feedback dashboard |

---

## 6. Cloud Computing Concepts Applied

1. **Storage Decoupling:** Relational metadata is stored in a structured SQL database, while multi-megabyte binary documents reside in an object store.
2. **Stateless Compute:** FastAPI handlers maintain no server-side session memory, allowing instances to scale behind load balancers.
3. **Role-Based Access Control (RBAC):** Token payloads contain user identity and role claims, evaluated via dependency injection on every incoming request.
4. **Immutable UTC Timestamping:** Eliminates timezone skew and client manipulation.
5. **Private Bucket & Controlled Stream Retrieval:** Binary files are never exposed publicly; download requests are verified before streaming.

---

## 7. System Architecture & Workflow

```
[Student / Teacher Client] ──(HTTPS/REST)──> [FastAPI Backend]
                                                ├── [Auth Service (JWT/Bcrypt)]
                                                ├── [Deadline Service (UTC Checks)]
                                                ├── [Cloud DB: SQLAlchemy] ──> Users, Metadata, Marks
                                                └── [Cloud Storage Provider] ──> Raw PDF/ZIP Binaries
```

---

## 8. Database Design

- **Users:** `id` (UUID PK), `name`, `email` (Unique), `password_hash`, `role`, `created_at`
- **Courses:** `id` (UUID PK), `course_code` (Unique), `course_name`, `teacher_id` (FK to Users)
- **Assignments:** `id` (UUID PK), `course_id` (FK), `title`, `description`, `deadline` (DateTime UTC), `max_marks`, `allowed_extensions`, `max_file_size_mb`, `allow_late_submissions`, `created_by` (FK to Users)
- **Submissions:** `id` (UUID PK), `assignment_id` (FK), `student_id` (FK), `file_name`, `file_url`, `storage_path`, `file_size_bytes`, `mime_type`, `version`, `submitted_at`, `submission_status`, `marks`, `feedback`, `graded_by` (FK), `graded_at`

---

## 9. Verification & Test Results

The test suite executed with Pytest achieved a **100% pass rate** across all 25 specification scenarios:

1. Student registration — **PASS**
2. Teacher login — **PASS**
3. Invalid login rejection — **PASS**
4. Student dashboard authorization — **PASS**
5. Teacher dashboard authorization & student rejection (403) — **PASS**
6. Teacher creates assignment — **PASS**
7. Student views assignment — **PASS**
8. Valid PDF upload — **PASS**
9. Invalid file extension rejection — **PASS**
10. Oversized file rejection (413) — **PASS**
11. On-time submission status logic — **PASS**
12. Late submission status logic — **PASS**
13. Student resubmission with version bump — **PASS**
14. Student views own submissions — **PASS**
15. Student cross-access prevented (403) — **PASS**
16. Teacher views all submissions — **PASS**
17. Teacher grades submission — **PASS**
18. Marks above maximum rejected (400) — **PASS**
19. Student views feedback — **PASS**
20. Unauthorized grading attempt rejected (403) — **PASS**
21. File retrieval and streaming from storage — **PASS**
22. Directory traversal attack blocked — **PASS**
23. Database entity not found handling (404) — **PASS**
24. User logout handling — **PASS**
25. Protected route rejection without token (401) — **PASS**

---

## 10. Conclusion & Future Scope
The **Cloud-Based Student Assignment Submission & Feedback Portal** demonstrates a scalable, cloud-first implementation of academic workflow management. By strictly decoupling binary storage from metadata and enforcing server-side authorization and deadline validation, the system guarantees high performance, data integrity, and privacy. Future extensions include integrating plagiarism detection microservices using vector embeddings, automated rubric grading, and serverless asynchronous notification queues.
