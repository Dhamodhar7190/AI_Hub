from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from app.core.config import settings
from app.core.database import engine
from app.api.v1.api import api_router

# Import all models to register them with Base.metadata
from app.models import user, agent
from app.models.base import Base

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    description="""
    AI Agent Hub API - A comprehensive platform for discovering, submitting, and managing AI agents.
    
    ## Features
    
    * **Authentication**: JWT-based auth with email OTP verification
    * **Agent Management**: Submit, review, and discover AI agents
    * **User Management**: Role-based access control (User/Admin)
    * **Admin Panel**: Approve agents and manage users
    
    ## Authentication Flow
    
    1. Register with email/username/password
    2. Wait for admin approval
    3. Login with username -> receives OTP via email
    4. Verify OTP -> get JWT access token
    5. Use token for all authenticated requests
    """
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to AI Agent Hub API",
        "version": settings.VERSION,
        "docs": "/docs",
        "redoc": "/redoc"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "environment": "development" if settings.DEBUG else "production"
    }


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="debug" if settings.DEBUG else "info"
    )