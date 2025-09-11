from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base
import enum


class AgentStatus(enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class AgentCategory(enum.Enum):
    BUSINESS = "business"
    HEALTHCARE = "healthcare"
    FINANCE = "finance"
    SUPPLY_CHAIN = "supply_chain"
    INSURANCE = "insurance"
    HR = "hr"
    OPERATIONS = "operations"
    ENGINEERING = "engineering"


class Agent(Base):
    __tablename__ = "agents"
    __allow_unmapped__ = True
    
    name = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=False)
    app_url = Column(String, nullable=False)
    category = Column(String, nullable=False, index=True)
    status = Column(String, default=AgentStatus.PENDING.value, index=True)
    
    # Author relationship
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    author = relationship("User", back_populates="agents", foreign_keys=[author_id])
    
    # Approval tracking
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    approved_by_user = relationship("User", foreign_keys=[approved_by])
    
    # Views relationship
    views = relationship("AgentView", back_populates="agent", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Agent {self.name}>"
    
    @property
    def view_count(self) -> int:
        """Get total view count for this agent"""
        return len(self.views)
    
    @property
    def is_approved(self) -> bool:
        """Check if agent is approved"""
        return self.status == AgentStatus.APPROVED.value
    
    @property
    def is_pending(self) -> bool:
        """Check if agent is pending approval"""
        return self.status == AgentStatus.PENDING.value


class AgentView(Base):
    __tablename__ = "agent_views"
    __allow_unmapped__ = True
    
    agent_id = Column(Integer, ForeignKey("agents.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    viewed_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    agent = relationship("Agent", back_populates="views")
    user = relationship("User", back_populates="views")
    
    def __repr__(self):
        return f"<AgentView agent_id={self.agent_id} user_id={self.user_id}>"