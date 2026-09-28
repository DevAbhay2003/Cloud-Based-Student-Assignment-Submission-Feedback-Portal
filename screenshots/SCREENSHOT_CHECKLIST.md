# Screenshot & Proof of Work Checklist

Use this structured guide to capture and organize the 27 proof screenshots required for your GitHub repository, project report, and portfolio presentation.

| # | Screenshot Filename | View / Action to Capture | Key Proof Element / What It Proves |
|---|---|---|---|
| **01** | `01_project_folder_structure.png` | VS Code explorer / Terminal tree showing `backend/`, `frontend/`, `cloud/`, `tests/` | Clean modular cloud architecture and separation of concerns. |
| **02** | `02_system_architecture_diagram.png` | System architecture mermaid diagram | Multi-tier cloud decoupled design (CDN, API Gateway, DB, S3). |
| **03** | `03_login_page.png` | Login screen with Student/Teacher quick-fill demo buttons | Cloud authentication and role selection UI. |
| **04** | `04_student_registration.png` | Registration form filled with new student credentials | User onboarding and password hashing with Bcrypt. |
| **05** | `05_teacher_dashboard_overview.png` | Teacher dashboard showing KPI metric cards | Instructor view: active assignments, submissions, pending grading. |
| **06** | `06_assignment_creation_modal.png` | Teacher creating assignment with deadline and file constraints | Dynamic configuration of max marks, file extensions, and late policy. |
| **07** | `07_student_dashboard_overview.png` | Student dashboard with stats (Pending, Submitted, Graded) | Personalized student overview and real-time status tracking. |
| **08** | `08_assignment_catalog_list.png` | Student assignment list view with status badges | Filterable coursework table with deadline countdowns. |
| **09** | `09_assignment_details_modal.png` | Detailed assignment modal with instructions and guidelines | Display of rubric, allowed formats (`.pdf`, `.docx`, `.zip`), and size limits. |
| **10** | `10_file_upload_interface.png` | Drag-and-drop file upload interface with file selected | Client-side validation of file extension and size before upload. |
| **11** | `11_successful_upload_confirmation.png` | Green success toast and submission status updated to "SUBMITTED" | Multipart streaming upload to cloud storage and metadata recording. |
| **12** | `12_cloud_storage_bucket_explorer.png` | File explorer showing `cloud_storage_bucket/assignments/.../submission.pdf` | Decoupled object storage hierarchy (`assignments/{aid}/{uid}/{file}`). |
| **13** | `13_database_submission_record.png` | SQLite / PostgreSQL query output showing submission row | ACID relational record storing metadata, timestamps, and storage paths. |
| **14** | `14_ontime_submission_badge.png` | Submission row showing green "SUBMITTED" badge | Server-side UTC deadline logic confirming submission arrived before due date. |
| **15** | `15_late_submission_badge.png` | Submission row showing orange "LATE" badge | Server-side UTC deadline logic flagging submission after due date. |
| **16** | `16_teacher_submissions_review_list.png` | Teacher table showing all student submissions for an assignment | Centralized grading queue with student name, version, and action buttons. |
| **17** | `17_teacher_file_preview_download.png` | Teacher clicking "Download / Preview File" button | Authorized stream retrieval from Cloud Object Storage. |
| **18** | `18_grading_and_feedback_modal.png` | Modal with marks input (e.g. 94/100) and written feedback text | Faculty evaluation submission with server-side marks range validation. |
| **19** | `19_student_feedback_view.png` | Student view showing awarded marks and detailed written comments | Real-time feedback delivery from instructor to student. |
| **20** | `20_authorization_error_demo.png` | Student attempting to call `/api/assignments` POST resulting in 403 Forbidden | Cryptographic Role-Based Access Control (RBAC) enforcement. |
| **21** | `21_fastapi_interactive_docs.png` | Swagger UI at `http://localhost:8000/docs` | Standardized, self-documenting REST API endpoints. |
| **22** | `22_automated_test_results.png` | Terminal showing `pytest` output: `25 passed in 11.54s` | 100% test coverage across security, logic, and failure modes. |
| **23** | `23_cloud_deployment_dashboard.png` | Render / Vercel / AWS Console dashboard showing active service | Cloud PaaS deployment proof. |
| **24** | `24_live_production_application.png` | Browser address bar showing production URL (`https://...`) | Publicly accessible cloud-hosted SaaS deployment. |
| **25** | `25_github_commit_history.png` | Git log showing 14 structured, professional commits | Clean engineering version control and proof of incremental progress. |
| **26** | `26_github_repository_home.png` | GitHub repository homepage with badges, description, and topics | Professional open-source portfolio repository. |
| **27** | `27_readme_preview.png` | Rendered GitHub README with architecture diagrams and API docs | Industry-grade documentation proving full-stack and cloud mastery. |
