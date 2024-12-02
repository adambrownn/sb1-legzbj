import React from 'react';
import { format } from 'date-fns';
import { Star, ThumbsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useReviewStore } from '@/lib/store/review-store';
import type { Review } from '@/lib/types/review';

interface ReviewListProps {
  propertyId: string;
  page: number;
  onPageChange: (page: number) => void;
}

const REVIEWS_PER_PAGE = 5;

export function ReviewList({ propertyId, page, onPageChange }: ReviewListProps) {
  const reviews = useReviewStore((state) => state.getPropertyReviews(propertyId));
  const { markHelpful } = useReviewStore();

  const totalPages = Math.ceil(reviews.length / REVIEWS_PER_PAGE);
  const startIndex = (page - 1) * REVIEWS_PER_PAGE;
  const displayedReviews = reviews.slice(startIndex, startIndex + REVIEWS_PER_PAGE);

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
                  {format(new Date(review.createdAt), 'PPP')}
                </span>
              </div>
            </div>
            <button
              onClick={() => handleHelpful(review)}
              className="flex items-center gap-1 rounded-full bg-gray-50 px-3 py-1 text-sm text-gray-600 hover:bg-gray-100"
            >
              <ThumbsUp className="h-4 w-4" />
              <span>{review.helpful}</span>
            </button>
          </div>
          <p className="mt-3 text-gray-600">{review.content}</p>
        </div>
      ))}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }).map((_, index) => (
            <Button
              key={index}
              variant={page === index + 1 ? 'primary' : 'outline'}
              onClick={() => onPageChange(index + 1)}
              className="h-8 w-8 p-0"
            >
              {index + 1}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}