import React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { useFeedbackStore } from '@/lib/store/feedback-store';
import type { Feedback } from '@/lib/store/feedback-store';

export function FeedbackManagement() {
  const [selectedFeedback, setSelectedFeedback] = React.useState<Feedback | null>(null);
  const [showDialog, setShowDialog] = React.useState(false);
  const { feedback, updateFeedback } = useFeedbackStore();

  const { register, handleSubmit } = useForm();

  const handleStatusUpdate = async (data: any) => {
    if (selectedFeedback) {
      updateFeedback(selectedFeedback.id, {
        status: data.status,
      });
      toast.success('Feedback status updated');
      setShowDialog(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Feedback Management</h2>
        <div className="flex gap-2">
          <select
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            {...register('filterStatus')}
          >
            <option value="">All Status</option>
            <option value="new">New</option>
            <option value="in-progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <select
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            {...register('filterType')}
          >
            <option value="">All Types</option>
            <option value="bug">Bug</option>
            <option value="feature">Feature</option>
            <option value="improvement">Improvement</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {feedback.map((item) => (
          <div
            key={item.id}
            className="rounded-lg border bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${
                    item.severity === 'critical' ? 'bg-red-100 text-red-800' :
                    item.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                    item.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {item.severity}
                  </span>
                  <span className="text-sm text-gray-500">{item.type}</span>
                </div>
                <p className="mt-2">{item.description}</p>
                <div className="mt-2 text-sm text-gray-500">
                  Submitted by: {item.userRole} on{' '}
                  {new Date(item.createdAt).toLocaleDateString()}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedFeedback(item);
                  setShowDialog(true);
                }}
              >
                Update Status
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        title="Update Feedback Status"
      >
        <form onSubmit={handleSubmit(handleStatusUpdate)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              {...register('status')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="new">New</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDialog(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              Update Status
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}