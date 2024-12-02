import React from 'react';
import { Button } from '@/components/ui/button';
import type { PropertyType } from '@/lib/types/property';

const PROPERTY_TYPES: Array<{ id: PropertyType; label: string }> = [
  { id: 'house', label: 'House' },
  { id: 'apartment', label: 'Apartment' },
  { id: 'villa', label: 'Villa' },
  { id: 'cabin', label: 'Cabin' },
];

interface PropertyTypeFilterProps {
  selected?: PropertyType;
  onChange: (type: PropertyType) => void;
}

export function PropertyTypeFilter({ selected, onChange }: PropertyTypeFilterProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">Property Type</label>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {PROPERTY_TYPES.map((type) => (
          <Button
            key={type.id}
            variant={selected === type.id ? 'primary' : 'outline'}
            onClick={() => onChange(type.id)}
            className="justify-start"
          >
            {type.label}
          </Button>
        ))}
      </div>
    </div>
  );
}