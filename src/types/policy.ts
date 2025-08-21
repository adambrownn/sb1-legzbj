// src/types/policy.ts
export type PolicyType = 'FLEXIBLE' | 'MODERATE' | 'STRICT';

export interface CancellationPolicy {
  id: string;
  type: PolicyType;
  propertyId: string;
  description: string;
  refundPercentage: number;
  daysBeforeCheckIn: number;
  customRules?: string[];
}

export const DEFAULT_POLICIES: Record<PolicyType, Omit<CancellationPolicy, 'id' | 'propertyId'>> = {
  FLEXIBLE: {
    type: 'FLEXIBLE',
    description: 'Full refund if canceled 24 hours before check-in',
    refundPercentage: 100,
    daysBeforeCheckIn: 1,
  },
  MODERATE: {
    type: 'MODERATE',
    description: 'Full refund if canceled 7 days before check-in',
    refundPercentage: 100,
    daysBeforeCheckIn: 7,
  },
  STRICT: {
    type: 'STRICT',
    description: 'No refund if canceled within 14 days of check-in',
    refundPercentage: 0,
    daysBeforeCheckIn: 14,
  },
};