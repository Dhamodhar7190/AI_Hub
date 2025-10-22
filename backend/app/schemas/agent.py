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


# Rating & Review Schemas

class RatingCreate(BaseModel):
    rating: int  # 1-5 stars

    class Config:
        json_schema_extra = {
            "example": {
                "rating": 5
            }
        }


class ReviewCreate(BaseModel):
    rating: int  # 1-5 stars
    review_text: str

    class Config:
        json_schema_extra = {
            "example": {
                "rating": 5,
                "review_text": "Excellent AI agent! Very helpful and accurate."
            }
        }


class ReviewUpdate(BaseModel):
    rating: Optional[int] = None
    review_text: Optional[str] = None


class ReviewResponse(BaseModel):
    id: int
    agent_id: int
    user_id: int
    rating: int
    review_text: str
    is_helpful_count: int
    reviewed_at: datetime
    updated_at: datetime
    user: UserResponse

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "agent_id": 1,
                "user_id": 1,
                "rating": 5,
                "review_text": "Excellent AI agent!",
                "is_helpful_count": 10,
                "reviewed_at": "2023-01-01T00:00:00",
                "updated_at": "2023-01-01T00:00:00",
                "user": {
                    "id": 1,
                    "email": "user@example.com",
                    "username": "john_doe",
                    "roles": ["user"],
                    "is_active": True,
                    "created_at": "2023-01-01T00:00:00"
                }
            }
        }


class AgentRatingStats(BaseModel):
    average_rating: float
    rating_count: int
    review_count: int
    rating_distribution: dict  # {1: 0, 2: 1, 3: 5, 4: 10, 5: 20}

    class Config:
        json_schema_extra = {
            "example": {
                "average_rating": 4.5,
                "rating_count": 36,
                "review_count": 20,
                "rating_distribution": {
                    "1": 0,
                    "2": 1,
                    "3": 5,
                    "4": 10,
                    "5": 20
                }
            }
        }