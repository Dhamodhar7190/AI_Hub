from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.api.deps import get_current_user
from app.schemas.auth import UserResponse
from app.schemas.agent import AgentResponse
from app.models.user import User
from app.models.agent import Agent, AgentView

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    """Get current user's profile information"""
    
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        roles=current_user.roles,
        is_active=current_user.is_active,
        created_at=current_user.created_at.isoformat(),
        approved_at=current_user.approved_at.isoformat() if current_user.approved_at else None
    )


@router.get("/me/agents", response_model=List[AgentResponse])
async def get_my_agents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all agents created by the current user"""
    
    agents = db.query(Agent).filter(
        Agent.author_id == current_user.id
    ).order_by(Agent.created_at.desc()).all()
    
    result = []
    for agent in agents:
        view_count = db.query(AgentView).filter(AgentView.agent_id == agent.id).count()
        
        agent_response = AgentResponse(
            id=agent.id,
            name=agent.name,
            description=agent.description,
            app_url=agent.app_url,
            category=agent.category,
            status=agent.status,
            created_at=agent.created_at,
            author={
                "id": current_user.id,
                "email": current_user.email,
                "username": current_user.username,
                "roles": current_user.roles,
                "is_active": current_user.is_active,
                "created_at": current_user.created_at.isoformat(),
                "approved_at": current_user.approved_at.isoformat() if current_user.approved_at else None
            },
            view_count=view_count,
            approved_at=agent.approved_at
        )
        result.append(agent_response)
    
    return result


@router.get("/me/stats")
async def get_user_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current user's statistics"""
    
    # Count user's agents by status
    from app.models.agent import AgentStatus
    
    total_agents = db.query(Agent).filter(Agent.author_id == current_user.id).count()
    pending_agents = db.query(Agent).filter(
        Agent.author_id == current_user.id,
        Agent.status == AgentStatus.PENDING.value
    ).count()
    approved_agents = db.query(Agent).filter(
        Agent.author_id == current_user.id,
        Agent.status == AgentStatus.APPROVED.value
    ).count()
    rejected_agents = db.query(Agent).filter(
        Agent.author_id == current_user.id,
        Agent.status == AgentStatus.REJECTED.value
    ).count()
    
    # Count total views on user's agents
    user_agents = db.query(Agent).filter(Agent.author_id == current_user.id).all()
    total_views = 0
    for agent in user_agents:
        views = db.query(AgentView).filter(AgentView.agent_id == agent.id).count()
        total_views += views
    
    # Get most popular agent
    most_popular_agent = None
    max_views = 0
    for agent in user_agents:
        views = db.query(AgentView).filter(AgentView.agent_id == agent.id).count()
        if views > max_views:
            max_views = views
            most_popular_agent = {
                "id": agent.id,
                "name": agent.name,
                "views": views
            }
    
    return {
        "agents": {
            "total": total_agents,
            "pending": pending_agents,
            "approved": approved_agents,
            "rejected": rejected_agents
        },
        "engagement": {
            "total_views": total_views,
            "most_popular_agent": most_popular_agent
        },
        "profile": {
            "member_since": current_user.created_at.isoformat(),
            "roles": current_user.roles,
            "is_admin": current_user.is_admin()
        }
    }


@router.get("/{user_id}", response_model=UserResponse)
async def get_user_profile(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user profile by ID (public information only)"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Only return public information
    return UserResponse(
        id=user.id,
        email=user.email if current_user.is_admin() else "***@***.***",  # Hide email for non-admins
        username=user.username,
        roles=user.roles,
        is_active=user.is_active,
        created_at=user.created_at.isoformat(),
        approved_at=user.approved_at.isoformat() if user.approved_at else None
    )


@router.get("/{user_id}/agents", response_model=List[AgentResponse])
async def get_user_agents(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get public agents by a specific user"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Only show approved agents for public view
    # Unless it's the user's own agents or admin viewing
    if current_user.id == user_id or current_user.is_admin():
        agents = db.query(Agent).filter(
            Agent.author_id == user_id
        ).order_by(Agent.created_at.desc()).all()
    else:
        agents = db.query(Agent).filter(
            Agent.author_id == user_id,
            Agent.status == "approved"
        ).order_by(Agent.created_at.desc()).all()
    
    result = []
    for agent in agents:
        view_count = db.query(AgentView).filter(AgentView.agent_id == agent.id).count()
        
        agent_response = AgentResponse(
            id=agent.id,
            name=agent.name,
            description=agent.description,
            app_url=agent.app_url,
            category=agent.category,
            status=agent.status,
            created_at=agent.created_at,
            author={
                "id": user.id,
                "email": user.email if current_user.is_admin() else "***@***.***",
                "username": user.username,
                "roles": user.roles,
                "is_active": user.is_active,
                "created_at": user.created_at.isoformat(),
                "approved_at": user.approved_at.isoformat() if user.approved_at else None
            },
            view_count=view_count,
            approved_at=agent.approved_at
        )
        result.append(agent_response)
    
    return result