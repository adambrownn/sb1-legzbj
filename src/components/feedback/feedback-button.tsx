import React from 'react';
import { MessageSquarePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { FeedbackForm } from './feedback-form';

export function FeedbackButton() {
  const [showDialog, setShowDialog] = React.useState(false);

  return (
    <>
      <Button
        onClick={() => setShowDialog(true)}
        className="fixed bottom-24 right-4 flex items-center gap-2 px-4 py-2 shadow-lg"
        title="Send Feedback"
      >
        <MessageSquarePlus className="h-5 w-5" />
        <span className="text-sm">Feedback</span>
      </Button>

      <Dialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        title="Share Your Feedback"
      >
        <FeedbackForm onSuccess={() => setShowDialog(false)} />
      </Dialog>
    </>
  );
}