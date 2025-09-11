#!/usr/bin/env python3
"""
Script to create admin user and sample data for AI Agent Hub
Run this script after setting up the database
"""

import sys
import os
from datetime import datetime

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.core.database import SessionLocal, engine
from app.core.security import get_password_hash
from app.models.base import Base
from app.models.user import User
from app.models.agent import Agent, AgentStatus, AgentCategory


def create_admin_user(db_session):
    """Create default admin user"""
    
    # Check if admin already exists
    existing_admin = db_session.query(User).filter(User.username == "admin").first()
    if existing_admin:
        print("✅ Admin user already exists")
        return existing_admin
    
    admin_user = User(
        email="admin@agenthub.com",
        username="admin",
        password_hash=get_password_hash("admin123"),
        roles=["user", "admin"],
        is_active=True,
        approved_at=datetime.utcnow()
    )
    
    db_session.add(admin_user)
    db_session.commit()
    db_session.refresh(admin_user)
    
    print("✅ Admin user created successfully!")
    print(f"   Email: {admin_user.email}")
    print(f"   Username: {admin_user.username}")
    print(f"   Password: admin123")
    print("   ⚠️  IMPORTANT: Change this password in production!")
    
    return admin_user


def create_sample_users(db_session, admin_user):
    """Create sample users for testing"""
    
    sample_users = [
        {
            "email": "john@example.com",
            "username": "john_doe",
            "password": "password123",
            "is_active": True
        },
        {
            "email": "jane@example.com", 
            "username": "jane_smith",
            "password": "password123",
            "is_active": True
        },
        {
            "email": "pending@example.com",
            "username": "pending_user",
            "password": "password123",
            "is_active": False
        }
    ]
    
    created_users = []
    for user_data in sample_users:
        existing_user = db_session.query(User).filter(User.username == user_data["username"]).first()
        if not existing_user:
            user = User(
                email=user_data["email"],
                username=user_data["username"],
                password_hash=get_password_hash(user_data["password"]),
                roles=["user"],
                is_active=user_data["is_active"],
                approved_by=admin_user.id if user_data["is_active"] else None,
                approved_at=datetime.utcnow() if user_data["is_active"] else None
            )
            db_session.add(user)
            created_users.append(user)
        else:
            created_users.append(existing_user)
    
    db_session.commit()
    
    active_count = sum(1 for user in sample_users if user["is_active"])
    pending_count = len(sample_users) - active_count
    
    print(f"✅ Sample users created: {active_count} active, {pending_count} pending approval")
    
    return created_users


def create_sample_agents(db_session, users):
    """Create sample agents"""
    
    sample_agents = [
        {
            "name": "AI Customer Support",
            "description": "Intelligent customer support chatbot that handles inquiries 24/7 with natural language processing capabilities.",
            "app_url": "https://example.com/ai-support",
            "category": AgentCategory.BUSINESS.value,
            "status": AgentStatus.APPROVED.value
        },
        {
            "name": "Healthcare Diagnostic Assistant",
            "description": "Advanced AI system that assists healthcare professionals with diagnostic recommendations and patient care insights.",
            "app_url": "https://example.com/health-ai",
            "category": AgentCategory.HEALTHCARE.value,
            "status": AgentStatus.APPROVED.value
        },
        {
            "name": "Financial Portfolio Manager",
            "description": "Automated investment portfolio management with risk assessment and market analysis capabilities.",
            "app_url": "https://example.com/portfolio-ai",
            "category": AgentCategory.FINANCE.value,
            "status": AgentStatus.APPROVED.value
        },
        {
            "name": "Supply Chain Optimizer",
            "description": "AI-powered supply chain optimization tool for inventory management and logistics planning.",
            "app_url": "https://example.com/supply-ai",
            "category": AgentCategory.SUPPLY_CHAIN.value,
            "status": AgentStatus.PENDING.value
        },
        {
            "name": "HR Recruitment Assistant",
            "description": "Intelligent recruitment tool that screens candidates and matches them with job requirements.",
            "app_url": "https://example.com/hr-ai",
            "category": AgentCategory.HR.value,
            "status": AgentStatus.APPROVED.value
        }
    ]
    
    active_users = [user for user in users if user.is_active]
    
    for i, agent_data in enumerate(sample_agents):
        existing_agent = db_session.query(Agent).filter(Agent.name == agent_data["name"]).first()
        if not existing_agent:
            author = active_users[i % len(active_users)]
            
            agent = Agent(
                name=agent_data["name"],
                description=agent_data["description"],
                app_url=agent_data["app_url"],
                category=agent_data["category"],
                author_id=author.id,
                status=agent_data["status"],
                approved_at=datetime.utcnow() if agent_data["status"] == AgentStatus.APPROVED.value else None
            )
            
            db_session.add(agent)
    
    db_session.commit()
    
    approved_count = sum(1 for agent in sample_agents if agent["status"] == AgentStatus.APPROVED.value)
    pending_count = len(sample_agents) - approved_count
    
    print(f"✅ Sample agents created: {approved_count} approved, {pending_count} pending")


def main():
    """Main setup function"""
    
    print("🚀 AI Agent Hub - Database Setup")
    print("=" * 40)
    
    # Create database tables
    print("📁 Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created")
    
    # Create database session
    db_session = SessionLocal()
    
    try:
        # Create admin user
        print("\n👤 Creating admin user...")
        admin_user = create_admin_user(db_session)
        
        # Create sample users
        print("\n👥 Creating sample users...")
        users = create_sample_users(db_session, admin_user)
        
        # Create sample agents
        print("\n🤖 Creating sample agents...")
        create_sample_agents(db_session, users)
        
        print("\n🎉 Setup completed successfully!")
        print("\n📋 Summary:")
        print("   - Admin user created (admin/admin123)")
        print("   - Sample users created (john_doe, jane_smith)")
        print("   - Sample agents created across different categories")
        print("   - Pending items for admin review")
        
        print("\n🌐 Next steps:")
        print("   1. Start the FastAPI server: uvicorn app.main:app --reload")
        print("   2. Visit http://localhost:8000/docs for API documentation")
        print("   3. Use the frontend to test the application")
        print("   4. Login with admin/admin123 to access admin features")
        
    except Exception as e:
        print(f"❌ Error during setup: {e}")
        db_session.rollback()
    finally:
        db_session.close()


if __name__ == "__main__":
    main()