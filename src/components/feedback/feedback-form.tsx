import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { feedbackSchema } from '@/lib/validations/feedback';
import { useFeedbackStore } from '@/lib/store/feedback-store';
import { useAuthStore } from '@/lib/store/auth-store';

interface FeedbackFormProps {
  onSuccess?: () => void;
}

export function FeedbackForm({ onSuccess }: FeedbackFormProps) {
  const { user } = useAuthStore();
  const { addFeedback } = useFeedbackStore();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(feedbackSchema),
  });

  const onSubmit = async (data: any) => {
    try {
      addFeedback({
        ...data,
        userId: user?.id,
        userRole: user?.role || 'guest',
      });
      toast.success('Thank you for your feedback!');
      reset();
      onSuccess?.();
    } catch (error) {
      toast.error('Failed to submit feedback');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Type of Feedback
        </label>
        <select
          {...register('type')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="bug">Bug Report</option>
          <option value="feature">Feature Request</option>
          <option value="improvement">Improvement Suggestion</option>
          <option value="other">Other</option>
        </select>
        {errors.type && (
          <p className="mt-1 text-sm text-red-600">{errors.type.message as string}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          {...register('description')}
          rows={4}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Please describe your feedback in detail..."
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">
            {errors.description.message as string}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Severity
        </label>
        <select
          {...register('severity')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
        {errors.severity && (
          <p className="mt-1 text-sm text-red-600">
            {errors.severity.message as string}
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
      </Button>
    </form>
  );
}