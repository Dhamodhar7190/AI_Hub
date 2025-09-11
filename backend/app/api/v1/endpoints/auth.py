from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_auth_service, get_current_user
from app.schemas.auth import (
    UserRegister, 
    UserLogin, 
    OTPVerification, 
    Token, 
    UserResponse,
    OTPDisplay,
    PasswordChange
)
from app.services.auth_service import AuthService
from app.models.user import User

router = APIRouter()


@router.post("/register", response_model=dict)
async def register(
    user_data: UserRegister,
    auth_service: AuthService = Depends(get_auth_service)
):
    """Register a new user"""
    return await auth_service.register_user(
        email=user_data.email,
        username=user_data.username,
        password=user_data.password
    )


@router.post("/login", response_model=OTPDisplay)
async def login(
    user_data: UserLogin,
    auth_service: AuthService = Depends(get_auth_service)
):
    """Initiate login process - sends OTP to user's email"""
    result = await auth_service.initiate_login(user_data.username)
    
    # Return OTP for testing (since email integration is not ready yet)
    return OTPDisplay(
        message=result.get("message", "OTP sent to your email"),
        otp_code=result.get("otp_code", ""),
        expires_in_minutes=result.get("expires_in_minutes", 5)
    )


@router.post("/verify-otp", response_model=Token)
async def verify_otp(
    otp_data: OTPVerification,
    auth_service: AuthService = Depends(get_auth_service)
):
    """Verify OTP and complete login"""
    return await auth_service.verify_otp_and_login(
        username=otp_data.username,
        otp_code=otp_data.otp_code
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Get current user information"""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        roles=current_user.roles,
        is_active=current_user.is_active,
        created_at=current_user.created_at.isoformat(),
        approved_at=current_user.approved_at.isoformat() if current_user.approved_at else None
    )


@router.post("/change-password")
async def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service)
):
    """Change user password"""
    return auth_service.change_password(
        user_id=current_user.id,
        current_password=password_data.current_password,
        new_password=password_data.new_password
    )


@router.post("/refresh", response_model=Token)
async def refresh_token(
    current_user: User = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service)
):
    """Refresh access token"""
    # Generate new token for current user
    from app.core.security import create_access_token
    from datetime import timedelta
    from app.core.config import settings
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=current_user.username,
        expires_delta=access_token_expires
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=current_user.id,
            email=current_user.email,
            username=current_user.username,
            roles=current_user.roles,
            is_active=current_user.is_active,
            created_at=current_user.created_at.isoformat(),
            approved_at=current_user.approved_at.isoformat() if current_user.approved_at else None
        )
    )