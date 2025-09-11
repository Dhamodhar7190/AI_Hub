from pydantic import BaseModel, HttpUrl
from typing import Optional
from datetime import datetime
from app.schemas.auth import UserResponse


class AgentCreate(BaseModel):
    name: str
    description: str
    app_url: str
    category: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "AI Assistant",
                "description": "An intelligent assistant for customer support",
                "app_url": "https://example.com/ai-assistant",
                "category": "business"
            }
        }


class AgentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    app_url: Optional[str] = None
    category: Optional[str] = None


class AgentResponse(BaseModel):
    id: int
    name: str
    description: str
    app_url: str
    category: str
    status: str
    created_at: datetime
    author: UserResponse
    view_count: int = 0
    approved_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "name": "AI Assistant",
                "description": "An intelligent assistant for customer support",
                "app_url": "https://example.com/ai-assistant",
                "category": "business",
                "status": "approved",
                "created_at": "2023-01-01T00:00:00",
                "author": {
                    "id": 1,
                    "email": "author@example.com",
                    "username": "author",
                    "roles": ["user"],
                    "is_active": True,
                    "created_at": "2023-01-01T00:00:00"
                },
                "view_count": 42,
                "approved_at": "2023-01-01T00:00:00"
            }
        }


class AgentApproval(BaseModel):
    approve: bool
    rejection_reason: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "approve": True,
                "rejection_reason": None
            }
        }


class AgentFilters(BaseModel):
    category: Optional[str] = None
    status: Optional[str] = None
    author_id: Optional[int] = None
    search: Optional[str] = None
    skip: int = 0
    limit: int = 20


class CategoryResponse(BaseModel):
    value: str
    label: str
    count: int = 0
    
    class Config:
        json_schema_extra = {
            "example": {
                "value": "business",
                "label": "Business",
                "count": 15
            }
        }