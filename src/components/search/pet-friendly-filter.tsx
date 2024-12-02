import React from 'react';

interface PetFriendlyFilterProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function PetFriendlyFilter({ checked, onChange }: PetFriendlyFilterProps) {
  return (
    <div className="flex items-center">
      <input
        type="checkbox"
        id="petFriendly"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      <label htmlFor="petFriendly" className="ml-2 text-sm text-gray-700">
        Pet Friendly
      </label>
    </div>
  );
}