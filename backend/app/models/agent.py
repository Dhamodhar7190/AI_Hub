from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Float
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


class ClickType(enum.Enum):
    MODAL_OPEN = "modal_open"
    NEW_TAB = "new_tab"
    EXTERNAL_LINK = "external_link"


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

    # Click tracking relationship
    clicks = relationship("AgentClick", back_populates="agent", cascade="all, delete-orphan")

    # Session tracking relationship
    sessions = relationship("AgentSession", back_populates="agent", cascade="all, delete-orphan")

    # Rating & Review relationships
    ratings = relationship("AgentRating", back_populates="agent", cascade="all, delete-orphan")
    reviews = relationship("AgentReview", back_populates="agent", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Agent {self.name}>"
    
    @property
    def view_count(self) -> int:
        """Get total view count for this agent"""
        return len(self.views)

    @property
    def average_rating(self) -> float:
        """Get average rating for this agent"""
        if not self.ratings:
            return 0.0
        return sum(r.rating for r in self.ratings) / len(self.ratings)

    @property
    def rating_count(self) -> int:
        """Get total number of ratings"""
        return len(self.ratings)

    @property
    def review_count(self) -> int:
        """Get total number of reviews"""
        return len(self.reviews)

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


class AgentClick(Base):
    __tablename__ = "agent_clicks"
    __allow_unmapped__ = True

    agent_id = Column(Integer, ForeignKey("agents.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    click_type = Column(String, nullable=False, index=True)  # modal_open, new_tab, external_link
    clicked_at = Column(DateTime, default=datetime.utcnow, index=True)
    referrer = Column(String, nullable=True)  # Where the click originated

    # Relationships
    agent = relationship("Agent", back_populates="clicks")
    user = relationship("User", back_populates="clicks")

    def __repr__(self):
        return f"<AgentClick agent_id={self.agent_id} user_id={self.user_id} type={self.click_type}>"


class AgentSession(Base):
    __tablename__ = "agent_sessions"
    __allow_unmapped__ = True

    agent_id = Column(Integer, ForeignKey("agents.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    session_start = Column(DateTime, default=datetime.utcnow, index=True)
    session_end = Column(DateTime, nullable=True)
    duration_seconds = Column(Float, nullable=True)  # Duration in seconds

    # Relationships
    agent = relationship("Agent", back_populates="sessions")
    user = relationship("User", back_populates="sessions")

    def __repr__(self):
        return f"<AgentSession agent_id={self.agent_id} user_id={self.user_id} duration={self.duration_seconds}s>"


class AgentRating(Base):
    __tablename__ = "agent_ratings"
    __allow_unmapped__ = True

    agent_id = Column(Integer, ForeignKey("agents.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    rating = Column(Integer, nullable=False)  # 1-5 stars
    rated_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    agent = relationship("Agent", back_populates="ratings")
    user = relationship("User", back_populates="ratings")

    def __repr__(self):
        return f"<AgentRating agent_id={self.agent_id} user_id={self.user_id} rating={self.rating}>"


class AgentReview(Base):
    __tablename__ = "agent_reviews"
    __allow_unmapped__ = True

    agent_id = Column(Integer, ForeignKey("agents.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    rating = Column(Integer, nullable=False)  # 1-5 stars (denormalized for easy querying)
    review_text = Column(Text, nullable=False)
    is_helpful_count = Column(Integer, default=0)  # Number of users who found this helpful
    reviewed_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    agent = relationship("Agent", back_populates="reviews")
    user = relationship("User", back_populates="reviews")

    def __repr__(self):
        return f"<AgentReview agent_id={self.agent_id} user_id={self.user_id} rating={self.rating}>"