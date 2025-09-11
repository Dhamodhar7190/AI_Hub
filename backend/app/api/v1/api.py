from fastapi import APIRouter

from app.api.v1.endpoints import auth, agents, users, admin

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(
    auth.router, 
    prefix="/auth", 
    tags=["Authentication"]
)

api_router.include_router(
    agents.router, 
    prefix="/agents", 
    tags=["Agents"]
)

api_router.include_router(
    users.router, 
    prefix="/users", 
    tags=["Users"]
)

api_router.include_router(
    admin.router, 
    prefix="/admin", 
    tags=["Admin"]
)