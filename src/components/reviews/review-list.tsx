import React, { useState } from 'react';
import { format } from 'date-fns';
import { Star, ThumbsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useReviewStore } from '@/lib/store/review-store';
import type { Review } from '@/lib/types/review';
import Sentiment from 'sentiment';

interface ReviewListProps {
  propertyId: string;
  page: number;
  onPageChange: (page: number) => void;
}

const REVIEWS_PER_PAGE = 5;

export function ReviewList({ propertyId, page, onPageChange }: ReviewListProps) {
  const reviews = useReviewStore((state) => state.getPropertyReviews(propertyId));
  const { markHelpful } = useReviewStore();

  const [sortOption, setSortOption] = useState<'date' | 'rating'>('date');
  const [filterRating, setFilterRating] = useState<number | null>(null);

  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortOption === 'date') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else {
      return b.rating - a.rating;
    }
  });

  const filteredReviews = filterRating
    ? sortedReviews.filter((review) => review.rating === filterRating)
    : sortedReviews;

  const totalPages = Math.ceil(filteredReviews.length / REVIEWS_PER_PAGE);
  const startIndex = (page - 1) * REVIEWS_PER_PAGE;

  const sentiment = new Sentiment();

  const displayedReviews = filteredReviews.slice(startIndex, startIndex + REVIEWS_PER_PAGE).map((review) => {
    const sentimentScore = sentiment.analyze(review.content).score;
    return { ...review, sentimentScore };
  });

  const handleHelpful = (review: Review) => {
    markHelpful(review.id);
  };

  if (reviews.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
        <p className="text-gray-600">No reviews yet. Be the first to review!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div>
          <label htmlFor="sort" className="mr-2">Sort by:</label>
          <select id="sort" value={sortOption} onChange={(e) => setSortOption(e.target.value as 'date' | 'rating')}>
            <option value="date">Date</option>
            <option value="rating">Rating</option>
          </select>
        </div>
        <div>
          <label htmlFor="filter" className="mr-2">Filter by Rating:</label>
          <select id="filter" value={filterRating ?? ''} onChange={(e) => setFilterRating(e.target.value ? parseInt(e.target.value) : null)}>
            <option value="">All</option>
            {[5, 4, 3, 2, 1].map((rating) => (
              <option key={rating} value={rating}>{rating} Stars</option>
            ))}
          </select>
        </div>
      </div>
      {displayedReviews.map((review) => (
        <div key={review.id} className="border-b pb-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-medium">{review.userName}</h3>
              <div className="mt-1 flex items-center">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < review.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'fill-gray-200 text-gray-200'
                    }`}
                  />
                ))}
                <span className="ml-2 text-sm text-gray-500">
                  {format(new Date(review.createdAt), 'MMM dd, yyyy')}
                </span>
              </div>
              <div className="mt-1 flex items-center">
                <span className={`text-sm ${review.sentimentScore > 0 ? 'text-green-500' : review.sentimentScore < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                  {review.sentimentScore > 0 ? '😊 Positive' : review.sentimentScore < 0 ? '😞 Negative' : '😐 Neutral'}
                </span>
              </div>
            </div>
            <Button variant="link" onClick={() => handleHelpful(review)}>
              <ThumbsUp className="mr-1 h-4 w-4" /> Helpful
            </Button>
          </div>
          <p className="mt-2 text-sm text-gray-700">{review.content}</p>
        </div>
      ))}
      <div className="flex justify-between pt-6">
        <Button onClick={() => onPageChange(page - 1)} disabled={page === 1}>
          Previous
        </Button>
        <span>
          Page {page} of {totalPages}
        </span>
        <Button onClick={() => onPageChange(page + 1)} disabled={page === totalPages}>
          Next
        </Button>
      </div>
    </div>
  );
}