import React, { useState } from 'react';
import { Send, X } from 'lucide-react';
import Button from '../common/Button';
import RatingStars from './RatingStars';
import { apiService } from '../../services/api';

interface ReviewFormProps {
  agentId: number;
  onSuccess: () => void;
  onCancel?: () => void;
  existingReview?: {
    rating: number;
    review_text: string;
  };
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  agentId,
  onSuccess,
  onCancel,
  existingReview
}) => {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [reviewText, setReviewText] = useState(existingReview?.review_text || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (reviewText.trim().length < 10) {
      setError('Review must be at least 10 characters');
      return;
    }

    setSubmitting(true);
    try {
      await apiService.createReview(agentId, {
        rating,
        review_text: reviewText
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h3 className="text-lg font-semibold text-white mb-4">
        {existingReview ? 'Edit Your Review' : 'Write a Review'}
      </h3>

      {/* Rating Section */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Your Rating *
        </label>
        <RatingStars
          rating={rating}
          onChange={setRating}
          size="lg"
        />
      </div>

      {/* Review Text */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Your Review *
        </label>
        <textarea
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="Share your experience with this agent..."
          rows={4}
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none resize-none"
          minLength={10}
          maxLength={1000}
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>Minimum 10 characters</span>
          <span>{reviewText.length}/1000</span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3">
        <Button
          type="submit"
          variant="primary"
          loading={submitting}
          className="flex-1 bg-orange-600 hover:bg-orange-700"
        >
          <Send className="w-4 h-4 mr-2" />
          {existingReview ? 'Update Review' : 'Submit Review'}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={submitting}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
};

export default ReviewForm;
