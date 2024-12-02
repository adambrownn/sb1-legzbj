import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Star } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { reviewSchema } from '@/lib/validations/review';
import { useReviewStore } from '@/lib/store/review-store';
import { useAuthStore } from '@/lib/store/auth-store';

interface ReviewFormProps {
  propertyId: string;
  onSuccess?: () => void;
}

export function ReviewForm({ propertyId, onSuccess }: ReviewFormProps) {
  const { user } = useAuthStore();
  const { addReview } = useReviewStore();
  const [hoveredRating, setHoveredRating] = React.useState(0);
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      content: '',
    },
  });

  const rating = watch('rating');

  const onSubmit = async (data: any) => {
    if (!user) return;

    try {
      addReview({
        propertyId,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        rating: data.rating,
        content: data.content,
      });
      
      toast.success('Review submitted successfully');
      reset();
      onSuccess?.();
    } catch (error) {
      toast.error('Failed to submit review');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Rating</label>
        <div className="mt-1 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setValue('rating', value)}
              onMouseEnter={() => setHoveredRating(value)}
              onMouseLeave={() => setHoveredRating(0)}
              className="rounded-full p-1 hover:bg-gray-100"
            >
              <Star
                className={`h-6 w-6 ${
                  value <= (hoveredRating || rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'fill-gray-200 text-gray-200'
                }`}
              />
            </button>
          ))}
        </div>
        {errors.rating && (
          <p className="mt-1 text-sm text-red-600">{errors.rating.message as string}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Review</label>
        <textarea
          {...register('content')}
          rows={4}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Share your experience..."
        />
        {errors.content && (
          <p className="mt-1 text-sm text-red-600">{errors.content.message as string}</p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Review'}
      </Button>
    </form>
  );
}