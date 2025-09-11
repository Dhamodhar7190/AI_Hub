from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.core.security import (
    verify_password, 
    get_password_hash, 
    create_access_token,
    generate_otp
)
from app.core.config import settings
from app.models.user import User
from app.services.email_service import email_service


class AuthService:
    """Authentication service for handling user auth logic"""
    
    def __init__(self, db: Session):
        self.db = db
    
    async def register_user(
        self, 
        email: str, 
        username: str, 
        password: str
    ) -> dict:
        """Register a new user"""
        
        # Check if user already exists
        if self.db.query(User).filter(User.email == email).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        if self.db.query(User).filter(User.username == username).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
        
        # Create new user (inactive until admin approval)
        db_user = User(
            email=email,
            username=username,
            password_hash=get_password_hash(password),
            roles=["user"],
            is_active=False
        )
        
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        
        # Notify admins about new registration
        await self._notify_admins_new_user(username, email)
        
        return {
            "message": "Registration successful. Waiting for admin approval.",
            "user_id": db_user.id
        }
    
    async def initiate_login(self, username: str) -> dict:
        """Initiate login process by sending OTP"""
        
        user = self.db.query(User).filter(User.username == username).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username"
            )
        
        # Refresh user object to get latest database state
        self.db.refresh(user)
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account not activated. Please wait for admin approval."
            )
        
        # Generate and store OTP
        otp_code = generate_otp()
        user.otp_code = otp_code
        user.otp_expires_at = datetime.utcnow() + timedelta(
            minutes=settings.OTP_EXPIRE_MINUTES
        )
        
        self.db.commit()
        
        # Send OTP via email service
        email_result = await email_service.send_otp_email(
            to_email=user.email,
            otp_code=otp_code,
            username=username
        )
        
        return email_result
    
    async def verify_otp_and_login(
        self, 
        username: str, 
        otp_code: str
    ) -> dict:
        """Verify OTP and complete login"""
        
        user = self.db.query(User).filter(User.username == username).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username"
            )
        
        # Refresh user object to get latest database state
        self.db.refresh(user)
        
        # Check OTP validity
        if not user.otp_code or user.otp_expires_at < datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="OTP has expired. Please request a new one."
            )
        
        if user.otp_code != otp_code:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid OTP code"
            )
        
        # Clear OTP after successful verification
        user.otp_code = None
        user.otp_expires_at = None
        self.db.commit()
        
        # Create access token
        access_token_expires = timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
        access_token = create_access_token(
            subject=user.username,
            expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "roles": user.roles,
                "is_active": user.is_active,
                "created_at": user.created_at.isoformat(),
                "approved_at": user.approved_at.isoformat() if user.approved_at else None
            }
        }
    
    def get_user_by_username(self, username: str) -> Optional[User]:
        """Get user by username"""
        return self.db.query(User).filter(User.username == username).first()
    
    def get_user_by_id(self, user_id: int) -> Optional[User]:
        """Get user by ID"""
        return self.db.query(User).filter(User.id == user_id).first()
    
    async def approve_user(self, user_id: int, approved_by: int) -> dict:
        """Approve a user registration"""
        
        user = self.get_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        if user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is already active"
            )
        
        # Activate user
        user.is_active = True
        user.approved_by = approved_by
        user.approved_at = datetime.utcnow()
        
        self.db.commit()
        
        # Notify user of approval
        await email_service.notify_user_approval(user.email, user.username)
        
        return {
            "message": "User approved successfully",
            "user_id": user.id
        }
    
    async def _notify_admins_new_user(self, username: str, email: str):
        """Notify all admins about new user registration"""
        
        admins = self.db.query(User).filter(
            User.roles.contains(["admin"]),
            User.is_active == True
        ).all()
        
        for admin in admins:
            await email_service.notify_admin_new_user(
                admin_email=admin.email,
                new_username=username,
                new_user_email=email
            )
    
    def change_password(
        self, 
        user_id: int, 
        current_password: str, 
        new_password: str
    ) -> dict:
        """Change user password"""
        
        user = self.get_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        if not verify_password(current_password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )
        
        user.password_hash = get_password_hash(new_password)
        self.db.commit()
        
        return {"message": "Password changed successfully"}