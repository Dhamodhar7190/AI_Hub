from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base


class User(Base):
    __tablename__ = "users"
    __allow_unmapped__ = True
    
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    roles = Column(ARRAY(String), default=["user"])
    is_active = Column(Boolean, default=False)
    
    # OTP fields
    otp_code = Column(String, nullable=True)
    otp_expires_at = Column(DateTime, nullable=True)
    
    # Approval tracking
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    
    # Relationships
    agents = relationship("Agent", back_populates="author", foreign_keys="[Agent.author_id]")
    views = relationship("AgentView", back_populates="user")
    
    # Self-referential relationship for approval
    approved_by_user = relationship("User", remote_side="User.id")
    
    def __repr__(self):
        return f"<User {self.username}>"
    
    def is_admin(self) -> bool:
        """Check if user has admin role"""
        return "admin" in (self.roles or [])
    
    def has_role(self, role: str) -> bool:
        """Check if user has specific role"""
        return role in (self.roles or [])