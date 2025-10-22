# Rating & Review System - Implementation Guide

## ✅ What's Been Completed

### Backend (100% Complete)
- [x] Database models (`AgentRating`, `AgentReview`)
- [x] API endpoints for rating and reviews
- [x] Request/Response schemas
- [x] Validation logic
- [x] User relationships

### Frontend (80% Complete - Manual Steps Needed)
- [x] TypeScript types
- [x] API service methods
- [x] React components (in RATING_REVIEW_COMPONENTS.tsx)
- [ ] **Manual**: Create component files (instructions below)
- [ ] **Manual**: Update AgentModal (instructions below)

---

## 🚀 Quick Start - Complete Implementation

### Step 1: Create Component Files

Create this folder structure:
```
frontend/src/components/rating/
├── RatingStars.tsx
├── ReviewForm.tsx
└── ReviewList.tsx
```

**Copy components from `RATING_REVIEW_COMPONENTS.tsx`:**

1. Open `RATING_REVIEW_COMPONENTS.tsx` (in project root)
2. Copy `RatingStars` component → Create `frontend/src/components/rating/RatingStars.tsx`
3. Copy `ReviewForm` component → Create `frontend/src/components/rating/ReviewForm.tsx`
4. Copy `ReviewList` component → Create `frontend/src/components/rating/ReviewList.tsx`

### Step 2: Update AgentModal

Open `frontend/src/components/agents/AgentModal.tsx` and add:

**1. Add imports at the top:**
```typescript
import RatingStars from '../rating/RatingStars';
import ReviewForm from '../rating/ReviewForm';
import ReviewList from '../rating/ReviewList';
import { Review, AgentRatingStats } from '../../types';
import { Star, MessageSquare } from 'lucide-react';
```

**2. Add state variables (after existing state):**
```typescript
const [reviews, setReviews] = useState<Review[]>([]);
const [ratingStats, setRatingStats] = useState<AgentRatingStats | null>(null);
const [showReviewForm, setShowReviewForm] = useState(false);
const [loadingReviews, setLoadingReviews] = useState(false);
```

**3. Add data loading function (after other functions):**
```typescript
const loadRatingsAndReviews = async () => {
  setLoadingReviews(true);
  try {
    const [statsData, reviewsData] = await Promise.all([
      apiService.getAgentRatingStats(agent.id),
      apiService.getAgentReviews(agent.id)
    ]);
    setRatingStats(statsData);
    setReviews(reviewsData);
  } catch (error) {
    console.error('Failed to load ratings and reviews:', error);
  } finally {
    setLoadingReviews(false);
  }
};
```

**4. Add useEffect to load data (after existing useEffect):**
```typescript
useEffect(() => {
  if (isOpen) {
    loadRatingsAndReviews();
  }
}, [isOpen, agent.id]);
```

**5. Add handlers:**
```typescript
const handleReviewSuccess = () => {
  setShowReviewForm(false);
  loadRatingsAndReviews();
};

const handleReviewDeleted = () => {
  loadRatingsAndReviews();
};
```

**6. Replace the modal content area (around line 90-150):**

```typescript
{/* Content Area - Add tabs for Details and Reviews */}
<div className="flex-1 flex flex-col min-h-0">
  {/* Tab Headers */}
  <div className="flex border-b border-gray-700 bg-gray-900 px-6">
    <button
      onClick={() => setActiveTab('details')}
      className={`px-4 py-3 font-medium transition-colors border-b-2 ${
        activeTab === 'details'
          ? 'border-orange-500 text-orange-500'
          : 'border-transparent text-gray-400 hover:text-white'
      }`}
    >
      Agent Details
    </button>
    <button
      onClick={() => setActiveTab('reviews')}
      className={`px-4 py-3 font-medium transition-colors border-b-2 flex items-center gap-2 ${
        activeTab === 'reviews'
          ? 'border-orange-500 text-orange-500'
          : 'border-transparent text-gray-400 hover:text-white'
      }`}
    >
      <MessageSquare className="w-4 h-4" />
      Reviews
      {ratingStats && ratingStats.review_count > 0 && (
        <span className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded-full">
          {ratingStats.review_count}
        </span>
      )}
    </button>
  </div>

  {/* Tab Content */}
  <div className="flex-1 overflow-auto">
    {activeTab === 'details' ? (
      /* EXISTING IFRAME CODE - Keep as is */
      <div className="relative bg-white h-full">
        {/* Loading State */}
        {!iframeLoaded && !iframeError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500 mx-auto mb-6"></div>
              <p className="text-gray-600 text-lg">Loading agent...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {iframeError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center max-w-lg mx-auto px-8">
              <AlertTriangle className="w-20 h-20 text-red-500 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Failed to Load Agent
              </h3>
              <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                This agent couldn't be loaded in the embedded view.
              </p>
              <Button
                onClick={handleOpenNewTab}
                variant="primary"
                className="bg-orange-600 hover:bg-orange-700"
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                Open in New Tab
              </Button>
            </div>
          </div>
        )}

        {/* Iframe */}
        <iframe
          src={agent.app_url}
          className={`w-full h-full border-0 ${iframeLoaded ? 'block' : 'hidden'}`}
          title={agent.name}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
        />
      </div>
    ) : (
      /* Reviews Tab */
      <div className="p-6 space-y-6">
        {/* Rating Overview */}
        {ratingStats && (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-start gap-8">
              {/* Average Rating */}
              <div className="text-center">
                <div className="text-5xl font-bold text-white mb-2">
                  {ratingStats.average_rating.toFixed(1)}
                </div>
                <RatingStars
                  rating={Math.round(ratingStats.average_rating)}
                  readonly
                  size="lg"
                />
                <div className="text-sm text-gray-400 mt-2">
                  {ratingStats.rating_count} ratings
                </div>
              </div>

              {/* Rating Distribution */}
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-300 mb-3">
                  Rating Distribution
                </h4>
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = ratingStats.rating_distribution[star.toString()] || 0;
                  const percentage = ratingStats.rating_count > 0
                    ? (count / ratingStats.rating_count) * 100
                    : 0;
                  return (
                    <div key={star} className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-gray-400 w-8">{star}★</span>
                      <div className="flex-1 bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-orange-500 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-400 w-12 text-right">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Write Review Button */}
        {!showReviewForm && (
          <Button
            onClick={() => setShowReviewForm(true)}
            variant="primary"
            className="w-full bg-orange-600 hover:bg-orange-700"
          >
            <Star className="w-4 h-4 mr-2" />
            Write a Review
          </Button>
        )}

        {/* Review Form */}
        {showReviewForm && (
          <ReviewForm
            agentId={agent.id}
            onSuccess={handleReviewSuccess}
            onCancel={() => setShowReviewForm(false)}
          />
        )}

        {/* Reviews List */}
        {loadingReviews ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        ) : (
          <ReviewList
            reviews={reviews}
            onReviewDeleted={handleReviewDeleted}
            onMarkHelpful={() => loadRatingsAndReviews()}
          />
        )}
      </div>
    )}
  </div>
</div>
```

**7. Add state for active tab (with other state variables):**
```typescript
const [activeTab, setActiveTab] = useState<'details' | 'reviews'>('details');
```

---

## 🧪 Testing

### 1. Start Backend
```bash
cd backend
python -m app.main
```

Tables `agent_ratings` and `agent_reviews` will be created automatically.

### 2. Start Frontend
```bash
cd frontend
npm start
```

### 3. Test Flow
1. Login to the application
2. Click on any approved agent
3. Click "Reviews" tab in the modal
4. Click "Write a Review"
5. Select rating (1-5 stars)
6. Write review text (minimum 10 characters)
7. Submit review
8. Verify it appears in the list
9. Test "Helpful" button
10. Test edit/delete your own review

---

## 📊 API Endpoints

### Rate Agent (Quick Rating)
```
POST /api/v1/agents/{agent_id}/rate
Body: { "rating": 5 }
Response: { "message": "...", "average_rating": 4.5, "total_ratings": 10 }
```

### Create/Update Review
```
POST /api/v1/agents/{agent_id}/review
Body: { "rating": 5, "review_text": "Great agent!" }
Response: Review object
```

### Get Reviews
```
GET /api/v1/agents/{agent_id}/reviews?skip=0&limit=20
Response: Array of Review objects
```

### Get Rating Stats
```
GET /api/v1/agents/{agent_id}/rating-stats
Response: {
  "average_rating": 4.5,
  "rating_count": 36,
  "review_count": 20,
  "rating_distribution": { "1": 0, "2": 1, "3": 5, "4": 10, "5": 20 }
}
```

### Delete Review
```
DELETE /api/v1/agents/{agent_id}/review
Response: { "message": "Review deleted successfully" }
```

### Mark Review Helpful
```
POST /api/v1/agents/{agent_id}/reviews/{review_id}/helpful
Response: { "message": "...", "helpful_count": 11 }
```

---

## 🎨 Features

### User Features
- ⭐ Rate agents 1-5 stars
- ✍️ Write detailed reviews
- 📝 Edit own reviews
- 🗑️ Delete own reviews
- 👍 Mark reviews as helpful
- 📊 View rating statistics
- 📈 See rating distribution

### Validation
- ✅ Rating must be 1-5
- ✅ Review minimum 10 characters
- ✅ Review maximum 1000 characters
- ✅ Only approved agents can be reviewed
- ✅ One review per user per agent
- ✅ Can update existing review

### Business Logic
- 📌 Rating and review saved together
- 📌 Reviews sorted by most recent
- 📌 Average rating calculated automatically
- 📌 Rating distribution tracked
- 📌 Can't mark own review as helpful

---

## 🗄️ Database Schema

### agent_ratings
```sql
- id (PK)
- agent_id (FK → agents)
- user_id (FK → users)
- rating (1-5)
- rated_at (timestamp)
```

### agent_reviews
```sql
- id (PK)
- agent_id (FK → agents)
- user_id (FK → users)
- rating (1-5, denormalized)
- review_text (text)
- is_helpful_count (integer)
- reviewed_at (timestamp)
- updated_at (timestamp)
```

---

## 🔍 Analytics Queries

### Top Rated Agents
```sql
SELECT
  a.id,
  a.name,
  AVG(r.rating) as avg_rating,
  COUNT(r.id) as rating_count
FROM agents a
LEFT JOIN agent_ratings r ON a.id = r.agent_id
WHERE a.status = 'approved'
GROUP BY a.id, a.name
HAVING COUNT(r.id) > 5
ORDER BY avg_rating DESC, rating_count DESC
LIMIT 10;
```

### Most Reviewed Agents
```sql
SELECT
  a.id,
  a.name,
  COUNT(rv.id) as review_count,
  AVG(rv.rating) as avg_rating
FROM agents a
LEFT JOIN agent_reviews rv ON a.id = rv.agent_id
GROUP BY a.id, a.name
ORDER BY review_count DESC
LIMIT 10;
```

### Helpful Reviews
```sql
SELECT
  rv.*,
  u.username,
  a.name as agent_name
FROM agent_reviews rv
JOIN users u ON rv.user_id = u.id
JOIN agents a ON rv.agent_id = a.id
WHERE rv.is_helpful_count > 5
ORDER BY rv.is_helpful_count DESC
LIMIT 20;
```

---

## ⚠️ Troubleshooting

### Reviews not loading
- Check browser console for errors
- Verify backend is running
- Check authentication token
- Verify agent is approved

### Can't submit review
- Ensure rating is selected
- Check review length (min 10 chars)
- Verify agent status is "approved"
- Check for existing review

### Rating distribution not showing
- Verify `getAgentRatingStats` API call
- Check browser network tab
- Ensure data is loading correctly

---

## 🚀 Next Steps (Optional Enhancements)

1. **Sort/Filter Reviews**
   - Most helpful
   - Most recent
   - Highest/lowest rated

2. **Review Images**
   - Allow users to upload screenshots
   - Image gallery in reviews

3. **Verified Reviews**
   - Badge for users who actually used the agent
   - Track agent usage before allowing review

4. **Review Moderation**
   - Admin approval for reviews
   - Report inappropriate reviews
   - Automated spam detection

5. **Email Notifications**
   - Notify author when agent is reviewed
   - Notify when review is marked helpful

---

## ✅ Completion Checklist

- [x] Backend models created
- [x] Backend endpoints implemented
- [x] Frontend types defined
- [x] Frontend API methods added
- [ ] Create Rating/Review components
- [ ] Update AgentModal
- [ ] Test rating functionality
- [ ] Test review submission
- [ ] Test edit/delete
- [ ] Test helpful marking

---

**Status**: Backend 100% Complete | Frontend Components Ready | Manual Integration Required

**Last Updated**: 2025-10-22
