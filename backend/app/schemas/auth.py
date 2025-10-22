from __future__ import annotations
from pydantic import BaseModel, EmailStr
from typing import List, Optional


class UserLogin(BaseModel):
    email: EmailStr


class UserRegister(BaseModel):
    email: EmailStr
    username: str
    password: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "username": "johndoe",
                "password": "securepassword123"
            }
        }


class OTPVerification(BaseModel):
    email: EmailStr
    otp_code: str

    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "otp_code": "123456"
            }
        }


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class TokenPayload(BaseModel):
    sub: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    roles: List[str]
    is_active: bool
    created_at: str
    approved_at: Optional[str] = None
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "email": "user@example.com",
                "username": "johndoe",
                "roles": ["user"],
                "is_active": True,
                "created_at": "2023-01-01T00:00:00",
                "approved_at": "2023-01-01T00:00:00"
            }
        }


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


class OTPDisplay(BaseModel):
    """Model for displaying OTP in development"""
    message: str
    otp_code: str
    expires_in_minutes: int
    
    class Config:
        json_schema_extra = {
            "example": {
                "message": "OTP sent to your email",
                "otp_code": "123456",
                "expires_in_minutes": 5
            }
        }


# Resolve forward references
Token.model_rebuild()