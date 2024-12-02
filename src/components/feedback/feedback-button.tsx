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
        className="fixed bottom-4 right-4 gap-2 shadow-lg"
      >
        <MessageSquarePlus className="h-4 w-4" />
        Send Feedback
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