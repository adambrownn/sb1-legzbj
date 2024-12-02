import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { ReviewStats } from './review-stats';
import { ReviewList } from './review-list';
import { ReviewForm } from './review-form';
import { useAuthStore } from '@/lib/store/auth-store';

interface ReviewsSectionProps {
  propertyId: string;
}

export function ReviewsSection({ propertyId }: ReviewsSectionProps) {
  const [showReviewForm, setShowReviewForm] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const { user } = useAuthStore();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Guest Reviews</h2>
        {user && (
          <Button onClick={() => setShowReviewForm(true)}>
            Write a Review
          </Button>
        )}
      </div>

      <ReviewStats propertyId={propertyId} />
      
      <ReviewList
        propertyId={propertyId}
        page={currentPage}
        onPageChange={setCurrentPage}
      />

      <Dialog
        open={showReviewForm}
        onClose={() => setShowReviewForm(false)}
        title="Write a Review"
      >
        <ReviewForm
          propertyId={propertyId}
          onSuccess={() => setShowReviewForm(false)}
        />
      </Dialog>
    </div>
  );
}