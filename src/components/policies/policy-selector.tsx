// src/components/policies/policy-selector.tsx
import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PolicyType } from '@/types/policy';
import { Select } from '@/components/ui/select';
import { updatePropertyPolicy } from '@/api/policies';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface PolicySelectorProps {
  propertyId: string;
  value: PolicyType;
  onChange: (value: PolicyType) => void;
}

export function PolicySelector({ propertyId, value, onChange }: PolicySelectorProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  
  const { mutate: updatePolicy, isLoading } = useMutation({
    mutationFn: (newType: PolicyType) => updatePropertyPolicy(propertyId, newType),
    onSuccess: () => {
      queryClient.invalidateQueries(['property-policy', propertyId]);
      toast.success(t('policy.updatedSuccess'));
    },
    onError: () => {
      toast.error(t('policy.updateFailed'));
    },
  });

  const handleChange = (newValue: PolicyType) => {
    onChange(newValue);
    updatePolicy(newValue);
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        {t('policy.cancellationPolicy')}
      </label>
      <Select
        value={value}
        onValueChange={handleChange}
        disabled={isLoading}
        options={[
          { value: 'FLEXIBLE', label: t('policy.flexible') },
          { value: 'MODERATE', label: t('policy.moderate') },
          { value: 'STRICT', label: t('policy.strict') },
        ]}
      />
    </div>
  );
}