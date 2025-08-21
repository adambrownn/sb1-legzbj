import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type RewardsTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

interface TierThresholds {
  BRONZE: number;
  SILVER: number;
  GOLD: number;
  PLATINUM: number;
}

interface RewardsState {
  points: number;
  tier: RewardsTier;
  pointsHistory: {
    date: string;
    points: number;
    description: string;
  }[];
  redeemedPoints: number;
}

interface RewardsStore extends RewardsState {
  addPoints: (amount: number, description: string) => void;
  redeemPoints: (amount: number, description: string) => void;
  calculateTier: (points: number) => RewardsTier;
  getAvailablePoints: () => number;
}

const TIER_THRESHOLDS: TierThresholds = {
  BRONZE: 0,
  SILVER: 1000,
  GOLD: 5000,
  PLATINUM: 10000,
};

export const useRewardsStore = create<RewardsStore>()(
  persist(
    (set, get) => ({
      points: 0,
      tier: 'BRONZE',
      pointsHistory: [],
      redeemedPoints: 0,

      addPoints: (amount: number, description: string) => {
        const newPoints = get().points + amount;
        const newTier = get().calculateTier(newPoints);
        
        set((state) => ({
          points: newPoints,
          tier: newTier,
          pointsHistory: [
            ...state.pointsHistory,
            {
              date: new Date().toISOString(),
              points: amount,
              description,
            },
          ],
        }));
      },

      redeemPoints: (amount: number, description: string) => {
        const availablePoints = get().getAvailablePoints();
        if (amount <= availablePoints) {
          set((state) => ({
            redeemedPoints: state.redeemedPoints + amount,
            pointsHistory: [
              ...state.pointsHistory,
              {
                date: new Date().toISOString(),
                points: -amount,
                description,
              },
            ],
          }));
        }
      },

      calculateTier: (points: number) => {
        if (points >= TIER_THRESHOLDS.PLATINUM) return 'PLATINUM';
        if (points >= TIER_THRESHOLDS.GOLD) return 'GOLD';
        if (points >= TIER_THRESHOLDS.SILVER) return 'SILVER';
        return 'BRONZE';
      },

      getAvailablePoints: () => {
        const state = get();
        return state.points - state.redeemedPoints;
      },
    }),
    {
      name: 'rewards-storage',
    }
  )
);