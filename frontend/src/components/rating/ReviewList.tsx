import React from 'react';
import { ThumbsUp, Calendar, Edit2, Trash2 } from 'lucide-react';
import RatingStars from './RatingStars';
import { Review } from '../../types';
import { apiService } from '../../services/api';
import { useAuth } from '../../hooks';

interface ReviewListProps {
  reviews: Review[];
  onReviewDeleted?: () => void;
  onEditReview?: (review: Review) => void;
  onMarkHelpful?: (reviewId: number) => void;
}

const ReviewList: React.FC<ReviewListProps> = ({
  reviews,
  onReviewDeleted,
  onEditReview,
  onMarkHelpful
}) => {
  const { user } = useAuth();

  const handleMarkHelpful = async (agentId: number, reviewId: number) => {
    try {
      await apiService.markReviewHelpful(agentId, reviewId);
      if (onMarkHelpful) {
        onMarkHelpful(reviewId);
      }
    } catch (error) {
      console.error('Failed to mark review as helpful:', error);
    }
  };

  const handleDelete = async (agentId: number) => {
    if (window.confirm('Are you sure you want to delete your review?')) {
      try {
        await apiService.deleteReview(agentId);
        if (onReviewDeleted) {
          onReviewDeleted();
        }
      } catch (error) {
        console.error('Failed to delete review:', error);
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>No reviews yet. Be the first to review this agent!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div
          key={review.id}
          className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-4">
              {/* User Avatar */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-semibold">
                {review.user.username.charAt(0).toUpperCase()}
              </div>

              {/* User Info & Rating */}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">{review.user.username}</span>
                  {review.updated_at !== review.reviewed_at && (
                    <span className="text-xs text-gray-500">(edited)</span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <RatingStars rating={review.rating} readonly size="sm" />
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(review.reviewed_at)}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons (if own review) */}
            {user && user.id === review.user_id && (
              <div className="flex gap-2">
                {onEditReview && (
                  <button
                    onClick={() => onEditReview(review)}
                    className="p-2 text-gray-400 hover:text-orange-500 hover:bg-gray-700 rounded transition-colors"
                    title="Edit review"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(review.agent_id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-700 rounded transition-colors"
                  title="Delete review"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Review Text */}
          <p className="text-gray-300 leading-relaxed mb-4">
            {review.review_text}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-700">
            <button
              onClick={() => handleMarkHelpful(review.agent_id, review.id)}
              disabled={user?.id === review.user_id}
              className={`
                flex items-center gap-2 text-sm transition-colors
                ${user?.id === review.user_id
                  ? 'text-gray-500 cursor-not-allowed'
                  : 'text-gray-400 hover:text-orange-500'
                }
              `}
            >
              <ThumbsUp className="w-4 h-4" />
              <span>Helpful ({review.is_helpful_count})</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ReviewList;
