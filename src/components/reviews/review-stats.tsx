import React from 'react';
import { Star } from 'lucide-react';
import { useReviewStore } from '@/lib/store/review-store';

interface ReviewStatsProps {
  propertyId: string;
}

export function ReviewStats({ propertyId }: ReviewStatsProps) {
  const stats = useReviewStore((state) => state.getReviewStats(propertyId));

  return (
    <div className="mb-6 flex items-start justify-between">
      <div>
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
            <span className="ml-1 text-2xl font-bold">
              {stats.averageRating.toFixed(1)}
            </span>
          </div>
          <span className="text-gray-500">
            ({stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'})
          </span>
        </div>

        <div className="mt-4 space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = stats.ratingDistribution[rating] || 0;
            const percentage = stats.totalReviews
              ? (count / stats.totalReviews) * 100
              : 0;

            return (
              <div key={rating} className="flex items-center gap-2">
                <div className="flex w-12 items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm">{rating}</span>
                </div>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full bg-yellow-400"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-12 text-sm text-gray-500">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}