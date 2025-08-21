
// src/components/policies/cancellation-policy.tsx
import React from 'react';
import { CancellationPolicy as PolicyType } from '@/types/policy';
import { Card } from '@/components/ui/card';
import { CalendarDays, AlertCircle } from 'lucide-react';

interface CancellationPolicyProps {
  policy: PolicyType;
  className?: string;
}

export function CancellationPolicy({ policy, className }: CancellationPolicyProps) {
  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-start gap-4">
        <AlertCircle className="h-5 w-5 text-blue-600" />
        <div>
          <h3 className="text-lg font-semibold">Cancellation Policy - {policy.type}</h3>
          <p className="mt-2 text-gray-600">{policy.description}</p>
          
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
            <CalendarDays className="h-4 w-4" />
            <span>
              {policy.refundPercentage}% refund if canceled {policy.daysBeforeCheckIn} days before check-in
            </span>
          </div>
          
          {policy.customRules && policy.customRules.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium">Additional Rules:</h4>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-gray-600">
                {policy.customRules.map((rule, index) => (
                  <li key={index}>{rule}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}