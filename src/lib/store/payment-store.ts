import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Payment } from '@/lib/types/payment';

interface PaymentState {
  payments: Payment[];
  addPayment: (payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePayment: (id: string, payment: Partial<Payment>) => void;
  getBookingPayment: (bookingId: string) => Payment | undefined;
}

export const usePaymentStore = create<PaymentState>()(
  persist(
    (set, get) => ({
      payments: [],
      addPayment: (payment) => {
        const newPayment = {
          ...payment,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({
          payments: [...state.payments, newPayment],
        }));
      },
      updatePayment: (id, updates) => {
        set((state) => ({
          payments: state.payments.map((payment) =>
            payment.id === id
              ? { ...payment, ...updates, updatedAt: new Date().toISOString() }
              : payment
          ),
        }));
      },
      getBookingPayment: (bookingId) => {
        return get().payments.find((payment) => payment.bookingId === bookingId);
      },
    }),
    {
      name: 'payment-storage',
    }
  )
);