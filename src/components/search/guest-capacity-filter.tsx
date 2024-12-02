import React from 'react';

interface GuestCapacityFilterProps {
  value?: number;
  onChange: (value: number) => void;
}

export function GuestCapacityFilter({ value, onChange }: GuestCapacityFilterProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">Guests</label>
      <input
        type="number"
        min="1"
        value={value || ''}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
      />
    </div>
  );
}