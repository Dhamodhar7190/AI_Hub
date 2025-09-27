from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from datetime import datetime

from app.core.config import settings
from app.core.database import engine, SessionLocal
from app.core.security import get_password_hash
from app.api.v1.api import api_router

# Import all models to register them with Base.metadata
from app.models import user, agent
from app.models.base import Base
from app.models.user import User
from app.models.agent import Agent, AgentStatus, AgentCategory

# Create tables
Base.metadata.create_all(bind=engine)

def create_initial_data():
    """Create initial admin user and sample data on startup"""
    db = SessionLocal()
    try:
        # Check if admin already exists
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            # Create admin user
            admin_user = User(
                email="admin@agenthub.com",
                username="admin",
                password_hash=get_password_hash("admin123"),
                roles=["user", "admin"],
                is_active=True,
                approved_at=datetime.utcnow()
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
            print("✅ Admin user created: admin/admin123")
        else:
            print("✅ Admin user already exists")

    except Exception as e:
        print(f"❌ Error creating initial data: {e}")
        db.rollback()
    finally:
        db.close()

# Create initial data on startup
create_initial_data()

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