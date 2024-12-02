import type { UserRole } from '@/lib/store/auth-store';

export interface Review {
  id: string;
  propertyId: string;
  userId: string;
  userRole: UserRole;
  userName: string;
  rating: number;
  content: string;
  helpful: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
}