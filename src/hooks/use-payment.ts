import { useState, useCallback } from 'react';
import { PaymentService } from '../lib/services/payment.service';
import { useToast } from './use-toast';

interface PaymentHookOptions {
  onSuccess?: (paymentIntentId: string) => void;
  onError?: (error: string) => void;
}

export function usePayment(options: PaymentHookOptions = {}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const processPayment = useCallback(
    async (details: {
      amount: number;
      currency: string;
      bookingId: string;
      customerId: string;
      description: string;
      metadata?: Record<string, string>;
    }) => {
      setIsProcessing(true);
      setError(null);

      try {
        const result = await PaymentService.getInstance().processPayment(details);

        if (result.success && result.paymentIntentId) {
          toast({
            title: 'Payment Successful',
            description: 'Your payment has been processed successfully.',
            variant: 'success',
          });
          options.onSuccess?.(result.paymentIntentId);
          return result;
        } else {
          const errorMessage = result.error || 'Payment failed';
          setError(errorMessage);
          toast({
            title: 'Payment Failed',
            description: errorMessage,
            variant: 'error',
          });
          options.onError?.(errorMessage);
          return result;
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Payment processing failed';
        setError(errorMessage);
        toast({
          title: 'Payment Error',
          description: errorMessage,
          variant: 'error',
        });
        options.onError?.(errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setIsProcessing(false);
      }
    },
    [options, toast]
  );

  const refundPayment = useCallback(
    async (paymentIntentId: string, amount?: number) => {
      setIsProcessing(true);
      setError(null);

      try {
        const result = await PaymentService.getInstance().refundPayment(
          paymentIntentId,
          amount
        );

        if (result.success) {
          toast({
            title: 'Refund Successful',
            description: 'Your refund has been processed successfully.',
            variant: 'success',
          });
        } else {
          const errorMessage = result.error || 'Refund failed';
          setError(errorMessage);
          toast({
            title: 'Refund Failed',
            description: errorMessage,
            variant: 'error',
          });
        }

        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Refund processing failed';
        setError(errorMessage);
        toast({
          title: 'Refund Error',
          description: errorMessage,
          variant: 'error',
        });
        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setIsProcessing(false);
      }
    },
    [toast]
  );

  return {
    isProcessing,
    error,
    processPayment,
    refundPayment,
  };
}
