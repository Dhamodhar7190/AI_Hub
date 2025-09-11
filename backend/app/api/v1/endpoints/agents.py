from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from app.core.database import get_db
from app.api.deps import get_current_user, get_current_admin
from app.schemas.agent import (
    AgentCreate, 
    AgentResponse, 
    AgentFilters,
    CategoryResponse
)
from app.models.user import User
from app.models.agent import Agent, AgentView, AgentStatus, AgentCategory
from app.services.email_service import email_service

router = APIRouter()


@router.get("/")
async def get_agents(
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search in name and description"),
    status: Optional[str] = Query("approved", description="Filter by status"),
    skip: int = Query(0, ge=0, description="Number of agents to skip"),
    limit: int = Query(20, ge=1, le=100, description="Number of agents to return"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get list of agents with optional filtering"""
    
    query = db.query(Agent)
    
    # Apply status filter
    if status:
        query = query.filter(Agent.status == status)
    else:
        # Default to approved agents if no status specified
        query = query.filter(Agent.status == AgentStatus.APPROVED.value)
    
    # Apply filters
    if category:
        query = query.filter(Agent.category == category)
    
    if search:
        search_term = f"%{search.lower()}%"
        query = query.filter(
            Agent.name.ilike(search_term) | 
            Agent.description.ilike(search_term)
        )
    
    # Get total count for pagination
    total = query.count()
    
    # Get agents with pagination
    agents = query.offset(skip).limit(limit).all()
    
    # Build response with view counts
    agent_list = []
    for agent in agents:
        view_count = db.query(AgentView).filter(AgentView.agent_id == agent.id).count()
        
        agent_data = {
            "id": agent.id,
            "name": agent.name,
            "description": agent.description,
            "app_url": agent.app_url,
            "category": agent.category,
            "status": agent.status,
            "created_at": agent.created_at.isoformat(),
            "author": {
                "id": agent.author.id,
                "email": agent.author.email,
                "username": agent.author.username,
                "roles": agent.author.roles,
                "is_active": agent.author.is_active,
                "created_at": agent.author.created_at.isoformat(),
                "approved_at": agent.author.approved_at.isoformat() if agent.author.approved_at else None
            },
            "view_count": view_count,
            "approved_at": agent.approved_at.isoformat() if agent.approved_at else None
        }
        agent_list.append(agent_data)
    
    return {
        "agents": agent_list,
        "total": total,
        "limit": limit,
        "offset": skip
    }


@router.post("/", response_model=AgentResponse)
async def create_agent(
    agent_data: AgentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submit a new agent"""
    
    # Validate category
    valid_categories = [cat.value for cat in AgentCategory]
    if agent_data.category not in valid_categories:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid category. Must be one of: {valid_categories}"
        )
    
    # Create agent
    db_agent = Agent(
        name=agent_data.name,
        description=agent_data.description,
        app_url=agent_data.app_url,
        category=agent_data.category,
        author_id=current_user.id,
        status=AgentStatus.PENDING.value
    )
    
    db.add(db_agent)
    db.commit()
    db.refresh(db_agent)
    
    # Notify admins about new submission
    admins = db.query(User).filter(
        User.roles.contains(["admin"]),
        User.is_active == True
    ).all()
    
    for admin in admins:
        await email_service.send_notification_email(
            to_email=admin.email,
            subject="New Agent Submission - AI Agent Hub",
            content=f"""
            <h2>New Agent Submission</h2>
            <p>A new agent has been submitted for review:</p>
            <ul>
                <li><strong>Name:</strong> {agent_data.name}</li>
                <li><strong>Category:</strong> {agent_data.category}</li>
                <li><strong>Author:</strong> {current_user.username}</li>
                <li><strong>Description:</strong> {agent_data.description}</li>
            </ul>
            <p>Please review in the admin panel.</p>
            """
        )
    
    return AgentResponse(
        id=db_agent.id,
        name=db_agent.name,
        description=db_agent.description,
        app_url=db_agent.app_url,
        category=db_agent.category,
        status=db_agent.status,
        created_at=db_agent.created_at,
        author={
            "id": current_user.id,
            "email": current_user.email,
            "username": current_user.username,
            "roles": current_user.roles,
            "is_active": current_user.is_active,
            "created_at": current_user.created_at.isoformat(),
            "approved_at": current_user.approved_at.isoformat() if current_user.approved_at else None
        },
        view_count=0,
        approved_at=None
    )


@router.get("/{agent_id}", response_model=AgentResponse)
async def get_agent(
    agent_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get specific agent and record view"""
    
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )
    
    # Check if user can view this agent
    if not current_user.is_admin() and agent.status != AgentStatus.APPROVED.value:
        # Users can only view their own pending/rejected agents
        if agent.author_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this agent"
            )
    
    # Record view (only for approved agents)
    if agent.status == AgentStatus.APPROVED.value:
        # Check if user already viewed this agent recently (within last hour)
        recent_view = db.query(AgentView).filter(
            AgentView.agent_id == agent_id,
            AgentView.user_id == current_user.id,
            AgentView.viewed_at >= datetime.utcnow() - timedelta(hours=1)
        ).first()
        
        if not recent_view:
            view = AgentView(agent_id=agent_id, user_id=current_user.id)
            db.add(view)
            db.commit()
    
    view_count = db.query(AgentView).filter(AgentView.agent_id == agent_id).count()
    
    return AgentResponse(
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


@router.get("/categories/list", response_model=List[CategoryResponse])
async def get_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all available categories with agent counts"""
    
    categories = []
    for cat in AgentCategory:
        # Count approved agents in this category
        count = db.query(Agent).filter(
            Agent.category == cat.value,
            Agent.status == AgentStatus.APPROVED.value
        ).count()
        
        categories.append(CategoryResponse(
            value=cat.value,
            label=cat.value.replace('_', ' ').title(),
            count=count
        ))
    
    return categories


@router.get("/my/submissions", response_model=List[AgentResponse])
async def get_my_agents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current user's agent submissions"""
    
    agents = db.query(Agent).filter(Agent.author_id == current_user.id).all()
    
    result = []
    for agent in agents:
        view_count = db.query(AgentView).filter(AgentView.agent_id == agent.id).count()