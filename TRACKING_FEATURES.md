# Enhanced Agent Tracking System - Implementation Guide

## Overview
This document describes the enhanced tracking system implemented for the AI Agent Hub application. The system tracks user interactions with agents including views, clicks, and session duration.

## New Features

### 1. View Tracking (Fixed & Enhanced)
- **What**: Tracks when users view agent details
- **How**: Automatically records a view when clicking on an agent card
- **Deduplication**: Only 1 view per user per hour to avoid inflating numbers
- **Implementation**: `GET /api/v1/agents/{agent_id}` endpoint

### 2. Click Tracking
- **What**: Tracks all types of clicks on agents
- **Types**:
  - `modal_open`: When agent is opened in modal view
  - `new_tab`: When "Open in New Tab" button is clicked
  - `external_link`: For external links (future use)
- **Implementation**: `POST /api/v1/agents/{agent_id}/track-click`
- **Parameters**:
  - `click_type`: Type of click (required)
  - `referrer`: Where click originated (optional)

### 3. Session Tracking
- **What**: Tracks how long users interact with an agent
- **How**: Measures time from modal open to close
- **Features**:
  - Tracks visibility changes (when user switches tabs)
  - Minimum 1 second session to avoid noise
  - Automatically saves session on modal close
- **Implementation**: `POST /api/v1/agents/{agent_id}/track-session`
- **Parameters**:
  - `duration_seconds`: Session duration in seconds

## Database Schema

### New Tables

#### `agent_clicks`
```sql
CREATE TABLE agent_clicks (
    id SERIAL PRIMARY KEY,
    agent_id INTEGER REFERENCES agents(id) NOT NULL,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    click_type VARCHAR NOT NULL,  -- 'modal_open', 'new_tab', 'external_link'
    clicked_at TIMESTAMP DEFAULT NOW(),
    referrer VARCHAR,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_agent_clicks_agent_id ON agent_clicks(agent_id);
CREATE INDEX idx_agent_clicks_user_id ON agent_clicks(user_id);
CREATE INDEX idx_agent_clicks_type ON agent_clicks(click_type);
CREATE INDEX idx_agent_clicks_clicked_at ON agent_clicks(clicked_at);
```

#### `agent_sessions`
```sql
CREATE TABLE agent_sessions (
    id SERIAL PRIMARY KEY,
    agent_id INTEGER REFERENCES agents(id) NOT NULL,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    session_start TIMESTAMP DEFAULT NOW(),
    session_end TIMESTAMP,
    duration_seconds FLOAT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_agent_sessions_agent_id ON agent_sessions(agent_id);
CREATE INDEX idx_agent_sessions_user_id ON agent_sessions(user_id);
CREATE INDEX idx_agent_sessions_start ON agent_sessions(session_start);
```

## Backend Changes

### 1. Models (`backend/app/models/agent.py`)
- Added `ClickType` enum
- Added `AgentClick` model
- Added `AgentSession` model
- Added relationships in `Agent` model
- Added relationships in `User` model

### 2. API Endpoints (`backend/app/api/v1/endpoints/agents.py`)
- **Fixed**: `get_my_agents()` function (was incomplete)
- **New**: `POST /{agent_id}/track-click` - Track click events
- **New**: `POST /{agent_id}/track-session` - Track session duration

### 3. Enhanced Existing Endpoint
- `GET /{agent_id}` - Now properly records views with deduplication

## Frontend Changes

### 1. API Service (`frontend/src/services/api.ts`)
Added new methods:
```typescript
trackAgentClick(agentId: number, clickType: 'modal_open' | 'new_tab' | 'external_link', referrer?: string)
trackAgentSession(agentId: number, durationSeconds: number)
```

### 2. Dashboard (`frontend/src/components/pages/Dashboard.tsx`)
- Modified `handleAgentClick()` to call `getAgent()` API
- Tracks `modal_open` click type
- Records view automatically
- Updates agent with latest view count

### 3. Agent Modal (`frontend/src/components/agents/AgentModal.tsx`)
- Added session tracking with `useRef` hook
- Tracks session start time when modal opens
- Tracks session on:
  - Modal close
  - Tab visibility change (when user switches tabs)
  - Component unmount
- Modified "Open in New Tab" buttons to track `new_tab` click
- Minimum 1 second session duration filter

## How It Works

### User Journey: Viewing an Agent

1. **User clicks agent card** in Dashboard
   ```
   ↓
   ```
2. **Dashboard calls `apiService.getAgent(id)`**
   - Backend records view (if >1 hour since last view)
   - Returns agent with updated view count
   ```
   ↓
   ```
3. **Dashboard tracks click**
   - Calls `apiService.trackAgentClick(id, 'modal_open', 'dashboard')`
   - Backend records click in `agent_clicks` table
   ```
   ↓
   ```
4. **Modal opens, session starts**
   - Records `sessionStartTime`
   - User interacts with agent
   ```
   ↓
   ```
5. **User clicks "Open in New Tab"**
   - Tracks `new_tab` click
   - Opens agent in new browser tab
   - ✅ **NEW**: Now tracks new tab opens!
   ```
   ↓
   ```
6. **User closes modal**
   - Calculates session duration
   - Calls `apiService.trackAgentSession(id, duration)`
   - Backend records session in `agent_sessions` table

### Cross-Tab Tracking Solution

**Problem**: When users open agents in new tabs, we lose tracking.

**Solution**: Track the "Open in New Tab" click before opening:
```typescript
const handleOpenNewTab = async () => {
  await apiService.trackAgentClick(agent.id, 'new_tab', 'agent_modal');
  window.open(agent.app_url, '_blank');
};
```

This way, even though we can't track activity in the external tab, we know:
- Which agents users prefer to open in new tabs
- How many times each agent was opened externally
- User preferences for viewing modes

## Deployment Steps

### 1. Backend Deployment
```bash
cd backend

# Install dependencies (if needed)
pip install -r requirements.txt

# The new tables will be created automatically on startup
# via Base.metadata.create_all() in main.py

# Start the server
python -m app.main
```

### 2. Frontend Deployment
```bash
cd frontend

# Install dependencies (if needed)
npm install

# Build for production
npm run build

# Or start development server
npm start
```

### 3. Verification
1. Open the application
2. Click on an agent card
3. Check browser console for tracking calls
4. Verify in database:
```sql
-- Check views
SELECT * FROM agent_views ORDER BY viewed_at DESC LIMIT 10;

-- Check clicks
SELECT * FROM agent_clicks ORDER BY clicked_at DESC LIMIT 10;

-- Check sessions
SELECT * FROM agent_sessions ORDER BY session_start DESC LIMIT 10;
```

## Analytics Queries

### Most Viewed Agents
```sql
SELECT
    a.id,
    a.name,
    COUNT(av.id) as view_count
FROM agents a
LEFT JOIN agent_views av ON a.id = av.agent_id
WHERE a.status = 'approved'
GROUP BY a.id, a.name
ORDER BY view_count DESC
LIMIT 10;
```

### Most Clicked Agents (New Tabs)
```sql
SELECT
    a.id,
    a.name,
    COUNT(ac.id) as new_tab_clicks
FROM agents a
LEFT JOIN agent_clicks ac ON a.id = ac.agent_id
WHERE ac.click_type = 'new_tab'
GROUP BY a.id, a.name
ORDER BY new_tab_clicks DESC
LIMIT 10;
```

### Average Session Duration by Agent
```sql
SELECT
    a.id,
    a.name,
    COUNT(s.id) as session_count,
    AVG(s.duration_seconds) as avg_duration_seconds,
    MAX(s.duration_seconds) as max_duration_seconds
FROM agents a
LEFT JOIN agent_sessions s ON a.id = s.agent_id
GROUP BY a.id, a.name
HAVING COUNT(s.id) > 0
ORDER BY avg_duration_seconds DESC
LIMIT 10;
```

### User Engagement by Agent
```sql
SELECT
    a.id,
    a.name,
    COUNT(DISTINCT av.user_id) as unique_viewers,
    COUNT(av.id) as total_views,
    COUNT(DISTINCT ac.user_id) as unique_clickers,
    COUNT(ac.id) as total_clicks,
    AVG(s.duration_seconds) as avg_session_duration
FROM agents a
LEFT JOIN agent_views av ON a.id = av.agent_id
LEFT JOIN agent_clicks ac ON a.id = ac.agent_id
LEFT JOIN agent_sessions s ON a.id = s.agent_id
WHERE a.status = 'approved'
GROUP BY a.id, a.name
ORDER BY unique_viewers DESC;
```

## Future Enhancements

### Phase 1 (Completed) ✅
- [x] Fix view counting
- [x] Track modal opens
- [x] Track new tab opens
- [x] Track session duration
- [x] Cross-tab click tracking

### Phase 2 (Recommended Next Steps)
- [ ] Analytics dashboard for admins
  - Charts showing views/clicks over time
  - Popular agents by category
  - User engagement metrics
- [ ] User analytics page
  - Personal usage statistics
  - Most-used agents
  - Time spent per agent
- [ ] Export analytics data
  - CSV/JSON export
  - Date range filters
  - Custom reports

### Phase 3 (Advanced Features)
- [ ] Heatmap of agent usage by time
- [ ] User journey tracking
- [ ] A/B testing support
- [ ] Integration with Google Analytics
- [ ] Real-time analytics dashboard

## Testing

### Manual Testing Checklist
- [ ] Click an agent card from dashboard
- [ ] Verify view count increases (after 1 hour cooldown)
- [ ] Verify modal opens with agent details
- [ ] Keep modal open for 5+ seconds
- [ ] Close modal and verify session was tracked
- [ ] Click "Open in New Tab" button
- [ ] Verify new tab click was tracked
- [ ] Check browser console for no errors
- [ ] Verify database records

### API Testing with curl
```bash
# Track a click
curl -X POST "http://localhost:8000/api/v1/agents/1/track-click?click_type=modal_open&referrer=dashboard" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Track a session
curl -X POST "http://localhost:8000/api/v1/agents/1/track-session?duration_seconds=45.5" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Troubleshooting

### Views not increasing
- Check 1-hour deduplication window
- Verify user is authenticated
- Check browser console for errors
- Verify `GET /agents/{id}` is being called

### Clicks not being tracked
- Check network tab for API calls
- Verify authentication token
- Check backend logs for errors
- Verify click_type parameter

### Sessions showing 0 duration
- Minimum 1 second filter is applied
- Check if modal was open long enough
- Verify sessionStartTime is being set
- Check browser console for errors

## Security Considerations

1. **Authentication Required**: All tracking endpoints require valid JWT token
2. **Data Privacy**: User IDs are stored but can be anonymized for analytics
3. **Rate Limiting**: Consider adding rate limits to prevent abuse
4. **Data Retention**: Consider implementing data retention policies

## Performance Considerations

1. **Indexes**: All foreign keys and timestamp columns are indexed
2. **Async Tracking**: Frontend tracking calls don't block UI
3. **Fire-and-Forget**: Tracking failures are logged but don't break UX
4. **Deduplication**: View deduplication prevents database bloat

## Support

For issues or questions:
1. Check browser console for errors
2. Check backend logs
3. Verify database tables were created
4. Check API endpoint responses in network tab

---

**Last Updated**: 2025-10-22
**Version**: 2.0.0
**Author**: AI Agent Hub Team
