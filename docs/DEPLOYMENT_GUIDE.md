# Cloud Deployment Guide

This guide provides step-by-step instructions for deploying the **Cloud-Based Student Assignment Submission & Feedback Portal** using both **100% Free-Tier Cloud Services** (Student Friendly) and **Enterprise Cloud Infrastructure** (AWS / Azure / GCP).

---

## Strategy A: 100% Free-Tier Deployment (Student & Portfolio Friendly)

This approach requires zero credit cards or paid cloud commitments while delivering a fully public, live production URL for GitHub proof.

```
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│        Vercel / Netlify         │       │          Render.com             │
│   (React Frontend Hosting)      │ ───>  │   (FastAPI Backend Web Service) │
│   - Free global CDN edge        │ HTTPS │   - Free Linux container        │
│   - Automatic Git CI/CD         │       │   - Automatic HTTPS certificate │
└─────────────────────────────────┘       └────────────────┬────────────────┘
                                                           │
                                                           ▼
                                          ┌─────────────────────────────────┐
                                          │      Supabase / Neon Postgres   │
                                          │   (Managed Cloud Database)      │
                                          │   - Free 500MB relational tier  │
                                          │   - Automated daily snapshots   │
                                          └─────────────────────────────────┘
```

### 1. Database Deployment (Supabase or Neon PostgreSQL)
1. Navigate to [Supabase](https://supabase.com/) and create a free project named `assignment-portal-db`.
2. In Project Settings > Database, copy the **Connection String (URI)**:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxx.supabase.co:5432/postgres
   ```
3. In your local or cloud environment, set:
   ```env
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxx.supabase.co:5432/postgres
   ```

### 2. Backend Deployment (Render.com)
1. Push your repository to GitHub.
2. Sign in to [Render](https://render.com/) and click **New + > Web Service**.
3. Connect your GitHub repository.
4. Configure service settings:
   - **Name:** `cloud-assignment-portal-api`
   - **Environment:** `Python 3`
   - **Root Directory:** `.`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `python -m uvicorn backend.app:app --host 0.0.0.0 --port $PORT`
5. Under **Environment Variables**, add:
   - `DATABASE_URL`: Your Supabase connection string.
   - `SECRET_KEY`: A random 32-character string.
   - `ALLOWED_ORIGINS`: `https://your-frontend-app.vercel.app`
   - `STORAGE_PROVIDER`: `LOCAL` (or configure AWS S3 / Supabase Storage).
6. Click **Create Web Service**. Render will build and deploy the backend with free HTTPS.

### 3. Frontend Deployment (Vercel)
1. Sign in to [Vercel](https://vercel.com/) and click **Add New > Project**.
2. Select your repository.
3. Configure settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Under **Environment Variables**, set:
   - `VITE_API_URL`: Your Render backend URL (e.g., `https://cloud-assignment-portal-api.onrender.com`).
5. Click **Deploy**. Vercel provisions global edge caching and gives you a live domain (`https://assignment-portal.vercel.app`).

---

## Strategy B: Enterprise AWS Architecture Mapping

For students presenting to enterprise cloud employers, this maps our portal directly to AWS cloud services:

```mermaid
flowchart TD
    User["Students & Teachers"] --> Route53["Amazon Route 53 (DNS)"]
    Route53 --> CloudFront["Amazon CloudFront (CDN Edge)"]
    
    CloudFront -->|Static Frontend Assets| S3FE["Amazon S3 (Frontend Bucket)"]
    CloudFront -->|Dynamic REST API| APIGW["Amazon API Gateway / ALB"]
    
    APIGW --> Compute["AWS App Runner / ECS Fargate"]
    
    subgraph "Core AWS Cloud Services"
        Compute --> Cognito["Amazon Cognito (Authentication & User Pools)"]
        Compute --> RDS["Amazon RDS PostgreSQL (ACID Relational Database)"]
        Compute --> S3Files["Amazon S3 (Encrypted Object Storage for Submissions)"]
        Compute --> CloudWatch["Amazon CloudWatch (Logs & Metrics)"]
        Compute --> KMS["AWS KMS (Key Management for SSE-S3 Encryption)"]
    end
```

### AWS Service Mapping Table

| Project Component | Local Simulation | AWS Production Service | Azure Equivalent | GCP Equivalent |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend Delivery** | Vite Dev Server / Static dist | S3 + CloudFront CDN | Azure Static Web Apps | Firebase / Cloud CDN |
| **Compute / Backend** | Uvicorn ASGI Server | AWS App Runner / ECS Fargate | Azure Container Apps | Google Cloud Run |
| **API Gateway** | FastAPI Routing | Amazon API Gateway / ALB | Azure API Management | Google Cloud Endpoints |
| **Relational Database**| SQLite (`portal.db`) | Amazon RDS PostgreSQL | Azure Database for PG | Google Cloud SQL |
| **Object Storage** | `cloud_storage_bucket/` | Amazon S3 (Lifecycle + SSE) | Azure Blob Storage | Google Cloud Storage |
| **Identity & Access** | Bcrypt + Python-Jose | Amazon Cognito User Pools | Azure AD B2C | Firebase Auth / Identity |
| **Monitoring & Logs** | Python `logging` | Amazon CloudWatch | Azure Monitor | Google Cloud Logging |
| **Secret Management** | Local `.env` | AWS Secrets Manager / SSM | Azure Key Vault | GCP Secret Manager |
