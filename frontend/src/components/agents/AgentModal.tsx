import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X,
  ExternalLink,
  User,
  Calendar,
  Eye,
  AlertTriangle,
  Maximize2,
  Minimize2,
  Star,
  MessageSquare,
} from "lucide-react";
import { Agent, Review, AgentRatingStats } from "../../types";
import { AGENT_CATEGORIES } from "../../utils/constants";
import Button from "../common/Button";
import { apiService } from "../../services/api";
import RatingStars from "../rating/RatingStars";
import ReviewForm from "../rating/ReviewForm";
import ReviewList from "../rating/ReviewList";

interface AgentModalProps {
  agent: Agent;
  isOpen: boolean;
  onClose: () => void;
}

const AgentModal: React.FC<AgentModalProps> = ({ agent, isOpen, onClose }) => {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const sessionStartTime = useRef<number>(0);
  const [activeTab, setActiveTab] = useState<'details' | 'reviews'>('details');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [ratingStats, setRatingStats] = useState<AgentRatingStats | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);

  const categoryInfo = AGENT_CATEGORIES.find(
    (cat) => cat.value === agent.category
  );

  // Handle keyboard shortcuts and session tracking
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      // Record session start time
      sessionStartTime.current = Date.now();

      document.addEventListener("keydown", handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";

      // Handle session tracking on visibility change
      const handleVisibilityChange = () => {
        if (document.hidden && sessionStartTime.current > 0) {
          const duration = (Date.now() - sessionStartTime.current) / 1000;
          if (duration > 1) { // Only track sessions longer than 1 second
            apiService.trackAgentSession(agent.id, duration).catch(console.error);
          }
        } else if (!document.hidden) {
          // Reset session start when page becomes visible again
          sessionStartTime.current = Date.now();
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        // Track session on unmount
        if (sessionStartTime.current > 0) {
          const duration = (Date.now() - sessionStartTime.current) / 1000;
          if (duration > 1) {
            apiService.trackAgentSession(agent.id, duration).catch(console.error);
          }
        }

        document.removeEventListener("keydown", handleKeyDown);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        document.body.style.overflow = "unset";
      };
    }
  }, [isOpen, onClose, agent.id]);

  const handleIframeLoad = () => {
    setIframeLoaded(true);
    setIframeError(false);
  };

  const handleIframeError = () => {
    setIframeError(true);
    setIframeLoaded(true);
  };

  const handleOpenNewTab = async () => {
    // Track the new tab click
    try {
      await apiService.trackAgentClick(agent.id, 'new_tab', 'agent_modal');
    } catch (error) {
      console.error('Failed to track new tab click:', error);
    }
    window.open(agent.app_url, '_blank');
  };

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

  const handleReviewSuccess = () => {
    setShowReviewForm(false);
    loadRatingsAndReviews();
  };

  const handleReviewDeleted = () => {
    loadRatingsAndReviews();
  };

  // Load ratings and reviews when modal opens
  useEffect(() => {
    if (isOpen) {
      loadRatingsAndReviews();
    }
  }, [isOpen, agent.id]);

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9999] bg-black bg-opacity-80"
        onClick={onClose}
      />

      {/* Centered Modal Card */}
      <div className="fixed inset-0 z-[10000] pointer-events-none flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-[95vw] h-[90vh] flex flex-col pointer-events-auto overflow-hidden border border-gray-700">
            {/* Simple Header - Just Agent Name */}
            <div className="px-6 py-4 border-b border-gray-700 flex-shrink-0 bg-gray-900 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">
                {agent.name}
              </h2>
              <Button
                onClick={onClose}
                variant="primary"
                className="bg-red-600 hover:bg-red-700"
                size="sm"
              >
                <X className="w-4 h-4 mr-2" />
                Close
              </Button>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-gray-700 bg-gray-900 px-6 flex-shrink-0">
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

            {/* Content Area - Takes remaining space */}
            <div className="flex-1 relative min-h-0 overflow-hidden">
              {activeTab === 'details' ? (
                <div className="h-full bg-white">
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
                      This agent couldn't be loaded in the embedded view. This
                      might be due to security restrictions or the agent's
                      configuration.
                    </p>
                    <div className="flex gap-4 justify-center">
                      <Button
                        onClick={handleOpenNewTab}
                        variant="primary"
                        className="bg-orange-600 hover:bg-orange-700 px-6 py-3 text-lg"
                      >
                        <ExternalLink className="w-5 h-5 mr-2" />
                        Open in New Tab
                      </Button>
                      <Button
                        onClick={onClose}
                        variant="ghost"
                        className="px-6 py-3 text-lg"
                      >
                        <X className="w-5 h-5 mr-2" />
                        Close
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Iframe */}
              <iframe
                src={agent.app_url}
                className={`w-full h-full border-0 ${
                  iframeLoaded ? "block" : "hidden"
                }`}
                title={agent.name}
                onLoad={handleIframeLoad}
                onError={handleIframeError}
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
                allow="accelerometer; autoplay; camera; clipboard-write; encrypted-media; fullscreen; geolocation; gyroscope; microphone; midi; payment; usb; web-share"
              />
                </div>
              ) : (
                /* Reviews Tab */
                <div className="h-full overflow-y-auto bg-gray-900">
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
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-gray-700 bg-gray-900 flex justify-end flex-shrink-0">
              <Button
                onClick={handleOpenNewTab}
                variant="primary"
                className="bg-orange-600 hover:bg-orange-700"
                size="sm"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in New Tab
              </Button>
            </div>
          </div>
        </div>
    </>,
    document.body
  );
};

export default AgentModal;
