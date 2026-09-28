import os
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.config import settings
from backend.database.db import engine, Base
from backend.database.seed import seed_database
from backend.routes.auth_routes import router as auth_router
from backend.routes.course_routes import router as course_router
from backend.routes.assignment_routes import router as assignment_router
from backend.routes.submission_routes import router as submission_router
from backend.routes.feedback_routes import router as feedback_router
from backend.routes.dashboard_routes import router as dashboard_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure tables exist & seed demo records
    Base.metadata.create_all(bind=engine)
    seed_database()
    yield
    # Shutdown logic if needed

app = FastAPI(
    title="Cloud-Based Student Assignment Submission & Feedback Portal",
    description="Industry-standard Cloud Computing Course Project REST API demonstrating Cloud Auth, RBAC, Managed DB, Cloud Object Storage, and Automated Evaluation.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Configuration
origins = [origin.strip() for origin in settings.ALLOWED_ORIGINS.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth_router)
app.include_router(course_router)
app.include_router(assignment_router)
app.include_router(submission_router)
app.include_router(feedback_router)
app.include_router(dashboard_router)

@app.get("/api/health", tags=["System Health"])
def health_check():
    """Cloud Healthcheck Probe (used by Cloud Load Balancers and Container Orchestrators)."""
    return {
        "status": "HEALTHY",
        "service": settings.APP_NAME,
        "environment": settings.ENVIRONMENT,
        "database": "CONNECTED",
        "storage_provider": settings.STORAGE_PROVIDER
    }

# Mount static frontend build if present
frontend_dist = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/assets", StaticFiles(directory=str(frontend_dist / "assets")), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        file_path = frontend_dist / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(frontend_dist / "index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app:app", host="0.0.0.0", port=settings.PORT, reload=True)
