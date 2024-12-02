import React from 'react';
import { Button } from '@/components/ui/button';
import { AMENITIES } from '@/lib/constants';

interface AmenitiesFilterProps {
  selected: string[];
  onChange: (amenities: string[]) => void;
}

export function AmenitiesFilter({ selected, onChange }: AmenitiesFilterProps) {
  const handleToggle = (amenityId: string) => {
    const newSelected = selected.includes(amenityId)
      ? selected.filter(id => id !== amenityId)
      : [...selected, amenityId];
    onChange(newSelected);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">Amenities</label>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {AMENITIES.map((amenity) => (
          <Button
            key={amenity.id}
            variant={selected.includes(amenity.id) ? 'primary' : 'outline'}
            onClick={() => handleToggle(amenity.id)}
            className="justify-start"
          >
            {amenity.name}
          </Button>
        ))}
      </div>
    </div>
  );
}