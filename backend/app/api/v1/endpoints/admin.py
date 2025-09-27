from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.api.deps import get_current_admin
from app.schemas.agent import AgentResponse, AgentApproval
from app.schemas.auth import UserResponse
from app.models.user import User
from app.models.agent import Agent, AgentView, AgentStatus
from app.services.email_service import email_service

router = APIRouter()


@router.get("/pending-agents", response_model=List[AgentResponse])
async def get_pending_agents(
    skip: int = Query(0, ge=0, description="Number of agents to skip"),
    limit: int = Query(50, ge=1, le=100, description="Number of agents to return"),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """Get all pending agent submissions for admin review"""
    
    agents = db.query(Agent).filter(
        Agent.status == AgentStatus.PENDING.value
    ).order_by(Agent.created_at.desc()).offset(skip).limit(limit).all()
    
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
                "id": agent.author.id,
                "email": agent.author.email,
                "username": agent.author.username,
                "roles": agent.author.roles,
                "is_active": agent.author.is_active,
                "created_at": agent.author.created_at.isoformat(),
                "approved_at": agent.author.approved_at.isoformat() if agent.author.approved_at else None
            },
            view_count=view_count,
            approved_at=agent.approved_at
        )
        result.append(agent_response)
    
    return result


@router.patch("/agents/{agent_id}/approve")
async def approve_reject_agent(
    agent_id: int,
    approval_data: AgentApproval,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """Approve or reject an agent submission"""
    
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )
    
    if agent.status != AgentStatus.PENDING.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Agent has already been reviewed"
        )
    
    # Update agent status
    if approval_data.approve:
        agent.status = AgentStatus.APPROVED.value
        status_text = "approved"
    else:
        agent.status = AgentStatus.REJECTED.value
        status_text = "rejected"
    
    agent.approved_by = current_admin.id
    agent.approved_at = datetime.utcnow()
    
    db.commit()
    
    # Notify agent author
    await email_service.notify_agent_status(
        user_email=agent.author.email,
        agent_name=agent.name,
        status=agent.status,
        username=agent.author.username
    )
    
    return {
        "message": f"Agent {status_text} successfully",
        "agent_id": agent_id,
        "status": agent.status
    }


@router.get("/users", response_model=List[UserResponse])
async def get_all_users(
    include_inactive: bool = Query(True, description="Include inactive users"),
    skip: int = Query(0, ge=0, description="Number of users to skip"),
    limit: int = Query(50, ge=1, le=100, description="Number of users to return"),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """Get all users for admin management"""
    
    query = db.query(User)
    
    if not include_inactive:
        query = query.filter(User.is_active == True)
    
    users = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()
    
    result = []
    for user in users:
        user_response = UserResponse(
            id=user.id,
            email=user.email,
            username=user.username,
            roles=user.roles,
            is_active=user.is_active,
            created_at=user.created_at.isoformat(),
            approved_at=user.approved_at.isoformat() if user.approved_at else None
        )
        result.append(user_response)
    
    return result


@router.get("/users/pending", response_model=List[UserResponse])
async def get_pending_users(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """Get users pending approval"""
    
    users = db.query(User).filter(
        User.is_active == False
    ).order_by(User.created_at.desc()).all()
    
    result = []
    for user in users:
        user_response = UserResponse(
            id=user.id,
            email=user.email,
            username=user.username,
            roles=user.roles,
            is_active=user.is_active,
            created_at=user.created_at.isoformat(),
            approved_at=None
        )
        result.append(user_response)
    
    return result


@router.patch("/users/{user_id}/approve")
async def approve_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """Approve a user registration"""
    
    user = db.query(User).filter(User.id == user_id).first()
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
    user.approved_by = current_admin.id
    user.approved_at = datetime.utcnow()
    
    db.commit()
    
    # Notify user of approval
    await email_service.notify_user_approval(user.email, user.username)
    
    return {
        "message": "User approved successfully",
        "user_id": user_id
    }


@router.patch("/users/{user_id}/deactivate")
async def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """Deactivate a user account"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already inactive"
        )
    
    user.is_active = False
    db.commit()
    
    return {
        "message": "User deactivated successfully",
        "user_id": user_id
    }


@router.delete("/users/{user_id}/reject")
async def reject_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """Reject/Delete a pending user registration"""

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot reject an active user"
        )

    if user.id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot reject your own account"
        )

    # Delete the user
    db.delete(user)
    db.commit()

    return {
        "message": "User rejected and removed successfully",
        "user_id": user_id
    }


@router.patch("/users/{user_id}/make-admin")
async def make_user_admin(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """Grant admin role to a user"""

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot grant admin role to inactive user"
        )

    if "admin" in user.roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already an admin"
        )

    user.roles = list(set(user.roles + ["admin"]))
    db.commit()

    return {
        "message": "User granted admin role successfully",
        "user_id": user_id,
        "roles": user.roles
    }


@router.get("/stats")
async def get_admin_stats(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """Get admin dashboard statistics"""
    
    # Count agents by status
    pending_agents = db.query(Agent).filter(Agent.status == AgentStatus.PENDING.value).count()
    approved_agents = db.query(Agent).filter(Agent.status == AgentStatus.APPROVED.value).count()
    rejected_agents = db.query(Agent).filter(Agent.status == AgentStatus.REJECTED.value).count()
    
    # Count users
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    pending_users = db.query(User).filter(User.is_active == False).count()
    admin_users = db.query(User).filter(User.roles.contains(["admin"])).count()
    
    # Count total views
    total_views = db.query(AgentView).count()
    
    # Recent activity (last 7 days)
    from datetime import timedelta
    week_ago = datetime.utcnow() - timedelta(days=7)
    
    recent_agents = db.query(Agent).filter(Agent.created_at >= week_ago).count()
    recent_users = db.query(User).filter(User.created_at >= week_ago).count()
    recent_views = db.query(AgentView).filter(AgentView.viewed_at >= week_ago).count()
    
    return {
        "agents": {
            "total": pending_agents + approved_agents + rejected_agents,
            "pending": pending_agents,
            "approved": approved_agents,
            "rejected": rejected_agents,
            "recent": recent_agents
        },
        "users": {
            "total": total_users,
            "active": active_users,
            "pending": pending_users,
            "admins": admin_users,
            "recent": recent_users
        },
        "engagement": {
            "total_views": total_views,
            "recent_views": recent_views
        }
    }