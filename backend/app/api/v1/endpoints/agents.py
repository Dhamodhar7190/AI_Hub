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
    CategoryResponse,
    RatingCreate,
    ReviewCreate,
    ReviewUpdate,
    ReviewResponse,
    AgentRatingStats
)
from app.schemas.auth import UserResponse
from app.models.user import User
from app.models.agent import (
    Agent, AgentView, AgentClick, AgentSession,
    AgentRating, AgentReview,
    AgentStatus, AgentCategory, ClickType
)
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
        
        result.append(AgentResponse(
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
        ))
    
    return result


@router.post("/{agent_id}/track-click")
async def track_agent_click(
    agent_id: int,
    click_type: str = Query(..., description="Type of click: modal_open, new_tab, external_link"),
    referrer: Optional[str] = Query(None, description="Where the click originated"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Track agent click interactions"""
    
    # Verify agent exists
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )
    
    # Validate click type
    valid_click_types = [ct.value for ct in ClickType]
    if click_type not in valid_click_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid click type. Must be one of: {valid_click_types}"
        )
    
    # Record the click
    click = AgentClick(
        agent_id=agent_id,
        user_id=current_user.id,
        click_type=click_type,
        referrer=referrer
    )
    db.add(click)
    db.commit()
    
    return {
        "message": "Click tracked successfully",
        "agent_id": agent_id,
        "click_type": click_type
    }


@router.post("/{agent_id}/track-session")
async def track_agent_session(
    agent_id: int,
    duration_seconds: float = Query(..., description="Session duration in seconds"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Track agent session duration"""
    
    # Verify agent exists
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )
    
    # Validate duration
    if duration_seconds < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Duration must be a positive number"
        )
    
    # Record the session
    session_end = datetime.utcnow()
    session_start = session_end - timedelta(seconds=duration_seconds)
    
    session = AgentSession(
        agent_id=agent_id,
        user_id=current_user.id,
        session_start=session_start,
        session_end=session_end,
        duration_seconds=duration_seconds
    )
    db.add(session)
    db.commit()
    
    return {
        "message": "Session tracked successfully",
        "agent_id": agent_id,
        "duration_seconds": duration_seconds
    }
# Rating & Review Endpoints to be added to agents.py

@router.post("/{agent_id}/rate")
async def rate_agent(
    agent_id: int,
    rating_data: RatingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Rate an agent (1-5 stars) without a review"""

    # Verify agent exists
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )

    # Validate rating
    if rating_data.rating < 1 or rating_data.rating > 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rating must be between 1 and 5"
        )

    # Check if user already rated this agent
    existing_rating = db.query(AgentRating).filter(
        AgentRating.agent_id == agent_id,
        AgentRating.user_id == current_user.id
    ).first()

    if existing_rating:
        # Update existing rating
        existing_rating.rating = rating_data.rating
        existing_rating.rated_at = datetime.utcnow()
    else:
        # Create new rating
        new_rating = AgentRating(
            agent_id=agent_id,
            user_id=current_user.id,
            rating=rating_data.rating
        )
        db.add(new_rating)

    db.commit()

    # Calculate new average
    all_ratings = db.query(AgentRating).filter(AgentRating.agent_id == agent_id).all()
    avg_rating = sum(r.rating for r in all_ratings) / len(all_ratings)

    return {
        "message": "Rating submitted successfully",
        "rating": rating_data.rating,
        "average_rating": round(avg_rating, 2),
        "total_ratings": len(all_ratings)
    }


@router.get("/{agent_id}/rating-stats", response_model=AgentRatingStats)
async def get_agent_rating_stats(
    agent_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get rating statistics for an agent"""

    # Verify agent exists
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )

    # Get all ratings
    ratings = db.query(AgentRating).filter(AgentRating.agent_id == agent_id).all()

    # Calculate distribution
    distribution = {str(i): 0 for i in range(1, 6)}
    for rating in ratings:
        distribution[str(rating.rating)] += 1

    # Get review count
    review_count = db.query(AgentReview).filter(AgentReview.agent_id == agent_id).count()

    # Calculate average
    avg_rating = 0.0
    if ratings:
        avg_rating = sum(r.rating for r in ratings) / len(ratings)

    return AgentRatingStats(
        average_rating=round(avg_rating, 2),
        rating_count=len(ratings),
        review_count=review_count,
        rating_distribution=distribution
    )


@router.post("/{agent_id}/review", response_model=ReviewResponse)
async def create_review(
    agent_id: int,
    review_data: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create or update a review for an agent"""

    # Verify agent exists and is approved
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )

    if agent.status != AgentStatus.APPROVED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot review agents that are not approved"
        )

    # Validate rating
    if review_data.rating < 1 or review_data.rating > 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rating must be between 1 and 5"
        )

    # Validate review text
    if len(review_data.review_text.strip()) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Review must be at least 10 characters"
        )

    # Check if user already reviewed this agent
    existing_review = db.query(AgentReview).filter(
        AgentReview.agent_id == agent_id,
        AgentReview.user_id == current_user.id
    ).first()

    if existing_review:
        # Update existing review
        existing_review.rating = review_data.rating
        existing_review.review_text = review_data.review_text
        existing_review.updated_at = datetime.utcnow()
        review = existing_review
    else:
        # Create new review
        review = AgentReview(
            agent_id=agent_id,
            user_id=current_user.id,
            rating=review_data.rating,
            review_text=review_data.review_text
        )
        db.add(review)

    # Also update/create the rating
    existing_rating = db.query(AgentRating).filter(
        AgentRating.agent_id == agent_id,
        AgentRating.user_id == current_user.id
    ).first()

    if existing_rating:
        existing_rating.rating = review_data.rating
        existing_rating.rated_at = datetime.utcnow()
    else:
        new_rating = AgentRating(
            agent_id=agent_id,
            user_id=current_user.id,
            rating=review_data.rating
        )
        db.add(new_rating)

    db.commit()
    db.refresh(review)

    return ReviewResponse(
        id=review.id,
        agent_id=review.agent_id,
        user_id=review.user_id,
        rating=review.rating,
        review_text=review.review_text,
        is_helpful_count=review.is_helpful_count,
        reviewed_at=review.reviewed_at,
        updated_at=review.updated_at,
        user=UserResponse(
            id=current_user.id,
            email=current_user.email,
            username=current_user.username,
            roles=current_user.roles,
            is_active=current_user.is_active,
            created_at=current_user.created_at,
            approved_at=current_user.approved_at
        )
    )


@router.get("/{agent_id}/reviews", response_model=List[ReviewResponse])
async def get_agent_reviews(
    agent_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all reviews for an agent"""

    # Verify agent exists
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )

    # Get reviews ordered by most recent
    reviews = db.query(AgentReview).filter(
        AgentReview.agent_id == agent_id
    ).order_by(
        AgentReview.reviewed_at.desc()
    ).offset(skip).limit(limit).all()

    result = []
    for review in reviews:
        result.append(ReviewResponse(
            id=review.id,
            agent_id=review.agent_id,
            user_id=review.user_id,
            rating=review.rating,
            review_text=review.review_text,
            is_helpful_count=review.is_helpful_count,
            reviewed_at=review.reviewed_at,
            updated_at=review.updated_at,
            user=UserResponse(
                id=review.user.id,
                email=review.user.email,
                username=review.user.username,
                roles=review.user.roles,
                is_active=review.user.is_active,
                created_at=review.user.created_at,
                approved_at=review.user.approved_at
            )
        ))

    return result


@router.delete("/{agent_id}/review")
async def delete_review(
    agent_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete user's own review"""

    review = db.query(AgentReview).filter(
        AgentReview.agent_id == agent_id,
        AgentReview.user_id == current_user.id
    ).first()

    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )

    db.delete(review)
    db.commit()

    return {"message": "Review deleted successfully"}


@router.post("/{agent_id}/reviews/{review_id}/helpful")
async def mark_review_helpful(
    agent_id: int,
    review_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark a review as helpful (increment helpful count)"""

    review = db.query(AgentReview).filter(
        AgentReview.id == review_id,
        AgentReview.agent_id == agent_id
    ).first()

    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )

    # Increment helpful count
    review.is_helpful_count += 1
    db.commit()

    return {
        "message": "Review marked as helpful",
        "helpful_count": review.is_helpful_count
    }
