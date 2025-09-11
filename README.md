# AI Agent Hub 🚀

A comprehensive platform for discovering, submitting, and managing AI agents with JWT authentication and admin approval workflow.

## Quick Start with Docker

### Prerequisites
- Docker Desktop installed and running
- Docker Compose (included with Docker Desktop)

### 1. Start the Application

```bash
# Start all services (PostgreSQL + Backend API + Frontend)
docker-compose up -d

# View logs for all services
docker-compose logs -f

# View logs for specific service
docker-compose logs -f frontend
docker-compose logs -f backend

# Check status
docker-compose ps
```

### 2. Access the Application

- **Frontend Web App:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Documentation:** http://localhost:8000/docs
- **Health Checks:** 
  - Frontend: http://localhost:3000/health
  - Backend: http://localhost:8000/health

### 3. Default Admin Credentials

- **Username:** `admin`
- **Email:** `admin@agenthub.com`  
- **Password:** `admin123`

**⚠️ Important:** Change the default password after first login!

## Features

### 🎨 Modern React Frontend
- **React 18** with TypeScript for type safety
- **Tailwind CSS** for modern, responsive design
- **React Router** for client-side routing
- **Lucide Icons** for beautiful UI components
- **JWT Authentication** integration
- **Admin Dashboard** for user and agent management
- **Real-time Statistics** and analytics
- **Mobile-responsive** design

## API Features

### 🔐 Authentication System
- **JWT-based authentication** with email OTP verification
- **Role-based access control** (User/Admin)
- **Admin approval workflow** for new users

### 🤖 Agent Management
- **Submit AI agents** for review
- **Browse approved agents** by category
- **Admin review and approval** process
- **View tracking** for agent popularity

### 👥 User Management
- **User registration** with email verification
- **Profile management**
- **Admin user approval** system

## API Usage Examples

### 1. Login Process

```bash
# Step 1: Initiate login (get OTP)
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin"}'

# Step 2: Verify OTP (get JWT token)
curl -X POST "http://localhost:8000/api/v1/auth/verify-otp" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "otp_code": "YOUR_OTP_FROM_STEP1"}'
```

### 2. Register New User

```bash
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "newuser",
    "password": "securepassword123"
  }'
```

### 3. Submit AI Agent

```bash
curl -X POST "http://localhost:8000/api/v1/agents/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "My AI Assistant",
    "description": "An intelligent assistant for task automation",
    "app_url": "https://myagent.com",
    "category": "business"
  }'
```

## Docker Commands

### Development
```bash
# Start services
docker-compose up -d

# View logs for specific services
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop services  
docker-compose down

# Rebuild and restart (force rebuild)
docker-compose up -d --build

# Rebuild only specific service
docker-compose build frontend
docker-compose up -d frontend

# Execute commands in containers
docker-compose exec backend python -c "print('Hello from backend!')"
docker-compose exec frontend sh -c "ls -la /usr/share/nginx/html"
```

### Production
```bash
# Start with production configuration
docker-compose -f docker-compose.prod.yml up -d

# View production logs
docker-compose -f docker-compose.prod.yml logs -f
```

## Environment Configuration

Create a `.env` file from the template:

```bash
cp .env.example .env
```

### Backend Environment Variables:
- `DATABASE_URL` - PostgreSQL connection string
- `SECRET_KEY` - JWT secret key (change in production!)
- `USE_SENDGRID` - Enable email via SendGrid
- `DEBUG` - Enable debug mode

### Frontend Environment Variables:
- `REACT_APP_API_URL` - Backend API URL (default: http://localhost:8000)
- `REACT_APP_ENVIRONMENT` - Environment mode (development/production)
- `REACT_APP_VERSION` - Application version

## Database

The application uses PostgreSQL with automatic table creation. Database includes:

- **Users table** - User accounts with roles and approval tracking
- **Agents table** - AI agent submissions with approval workflow  
- **Agent_views table** - View tracking for analytics

## Architecture

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│   Frontend  │ ── │   Backend    │ ── │ PostgreSQL  │
│   React     │    │   FastAPI    │    │  Database   │
│  (Port 3000)│    │ (Port 8000)  │    │ (Port 5432) │
└─────────────┘    └──────────────┘    └─────────────┘
       │                    │                    │
       └────────────────────┼────────────────────┘
                            │
                   ┌──────────────┐
                   │    Docker    │
                   │  Compose     │
                   │   Network    │
                   └──────────────┘
```

### Container Structure
- **Frontend Container:** Nginx serving React build + API proxy
- **Backend Container:** FastAPI with Uvicorn server
- **Database Container:** PostgreSQL 15 with persistent volume
- **Network:** Internal Docker network for service communication

## Development

### Local Development (without Docker)

#### Backend Development
```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export DATABASE_URL="postgresql://postgres:root@localhost:5432/agent_hub"

# Run the application
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Development
```bash
cd frontend

# Install dependencies
npm install

# Set environment variables
echo "REACT_APP_API_URL=http://localhost:8000" > .env

# Run development server
npm start
```

### Add New Features

#### Backend Features
1. **Models:** Add to `app/models/`
2. **Schemas:** Add to `app/schemas/`  
3. **API Endpoints:** Add to `app/api/v1/endpoints/`
4. **Services:** Add business logic to `app/services/`

#### Frontend Features
1. **Components:** Add to `src/components/`
2. **Pages:** Add to `src/components/pages/`
3. **Hooks:** Add custom hooks to `src/hooks/`
4. **Services:** Add API services to `src/services/`
5. **Types:** Add TypeScript types to `src/types/`

## Security Features

- ✅ **Non-root container user**
- ✅ **Environment variable configuration** 
- ✅ **JWT token authentication**
- ✅ **Password hashing** with bcrypt
- ✅ **CORS protection**
- ✅ **Input validation** with Pydantic
- ✅ **SQL injection protection** with SQLAlchemy

## Health Monitoring

- **Health endpoint:** `GET /health`
- **Docker health checks** built-in
- **Container restart policies**
- **Database connection validation**

## Troubleshooting

### Common Issues

1. **Ports already in use:**
   ```bash
   # Change ports in docker-compose.yml
   ports:
     - "8001:8000"  # Backend: Use port 8001 instead
     - "3001:3000"  # Frontend: Use port 3001 instead
   ```

2. **Database connection failed:**
   ```bash
   # Check PostgreSQL container
   docker-compose logs postgres
   
   # Wait for database to be ready
   docker-compose up -d postgres
   docker-compose logs -f postgres
   ```

3. **Frontend build errors:**
   ```bash
   # Clear npm cache and rebuild
   docker-compose exec frontend npm cache clean --force
   docker-compose build --no-cache frontend
   ```

4. **Permission errors:**
   ```bash
   # Fix file permissions
   chmod -R 755 ./backend ./frontend
   
   # On Windows, ensure Docker has access to drives
   # Docker Desktop -> Settings -> Resources -> File Sharing
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes  
4. Test with Docker
5. Submit a pull request

---

**Your AI Agent Hub is now ready! 🎉**

- **Frontend App:** http://localhost:3000
- **API Documentation:** http://localhost:8000/docs
- **Database:** PostgreSQL running on port 5432

Enjoy building with your AI Agent Hub! 🚀