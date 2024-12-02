import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserRole } from './auth-store';

export interface Feedback {
  id: string;
  type: 'bug' | 'feature' | 'improvement' | 'other';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  userRole: UserRole;
  status: 'new' | 'in-progress' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
}

interface FeedbackState {
  feedback: Feedback[];
  addFeedback: (feedback: Omit<Feedback, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => void;
  updateFeedback: (id: string, updates: Partial<Feedback>) => void;
  getFeedbackByStatus: (status: Feedback['status']) => Feedback[];
  getFeedbackByType: (type: Feedback['type']) => Feedback[];
  getFeedbackTrends: () => {
    byType: Record<Feedback['type'], number>;
    bySeverity: Record<Feedback['severity'], number>;
  };
}

export const useFeedbackStore = create<FeedbackState>()(
  persist(
    (set, get) => ({
      feedback: [],
      addFeedback: (feedback) => {
        const newFeedback = {
          ...feedback,
          id: crypto.randomUUID(),
          status: 'new',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as Feedback;
        set((state) => ({
          feedback: [...state.feedback, newFeedback],
        }));
      },
      updateFeedback: (id, updates) => {
        set((state) => ({
          feedback: state.feedback.map((item) =>
            item.id === id
              ? { ...item, ...updates, updatedAt: new Date().toISOString() }
              : item
          ),
        }));
      },
      getFeedbackByStatus: (status) => {
        return get().feedback.filter((item) => item.status === status);
      },
      getFeedbackByType: (type) => {
        return get().feedback.filter((item) => item.type === type);
      },
      getFeedbackTrends: () => {
        const feedback = get().feedback;
        return {
          byType: feedback.reduce((acc, item) => {
            acc[item.type] = (acc[item.type] || 0) + 1;
            return acc;
          }, {} as Record<Feedback['type'], number>),
          bySeverity: feedback.reduce((acc, item) => {
            acc[item.severity] = (acc[item.severity] || 0) + 1;
            return acc;
          }, {} as Record<Feedback['severity'], number>),
        };
      },
    }),
    {
      name: 'feedback-storage',
    }
  )
);