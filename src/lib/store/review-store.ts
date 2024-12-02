import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Review, ReviewStats } from '@/lib/types/review';

interface ReviewState {
  reviews: Review[];
  addReview: (review: Omit<Review, 'id' | 'createdAt' | 'updatedAt' | 'helpful'>) => void;
  updateReview: (id: string, review: Partial<Review>) => void;
  deleteReview: (id: string) => void;
  markHelpful: (id: string) => void;
  getPropertyReviews: (propertyId: string) => Review[];
  getReviewStats: (propertyId: string) => ReviewStats;
}

export const useReviewStore = create<ReviewState>()(
  persist(
    (set, get) => ({
      reviews: [],
      addReview: (review) => {
        const newReview = {
          ...review,
          id: crypto.randomUUID(),
          helpful: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({
          reviews: [...state.reviews, newReview],
        }));
      },
      updateReview: (id, updates) => {
        set((state) => ({
          reviews: state.reviews.map((review) =>
            review.id === id
              ? { ...review, ...updates, updatedAt: new Date().toISOString() }
              : review
          ),
        }));
      },
      deleteReview: (id) => {
        set((state) => ({
          reviews: state.reviews.filter((review) => review.id !== id),
        }));
      },
      markHelpful: (id) => {
        set((state) => ({
          reviews: state.reviews.map((review) =>
            review.id === id
              ? { ...review, helpful: review.helpful + 1 }
              : review
          ),
        }));
      },
      getPropertyReviews: (propertyId) => {
        return get().reviews
          .filter((review) => review.propertyId === propertyId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },
      getReviewStats: (propertyId) => {
        const propertyReviews = get().getPropertyReviews(propertyId);
        const totalReviews = propertyReviews.length;
        
        if (totalReviews === 0) {
          return {
            averageRating: 0,
            totalReviews: 0,
            ratingDistribution: {},
          };
        }

        const ratingDistribution = propertyReviews.reduce((acc, review) => {
          acc[review.rating] = (acc[review.rating] || 0) + 1;
          return acc;
        }, {} as Record<number, number>);

        const averageRating =
          propertyReviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;

        return {
          averageRating,
          totalReviews,
          ratingDistribution,
        };
      },
    }),
    {
      name: 'review-storage',
    }
  )
);