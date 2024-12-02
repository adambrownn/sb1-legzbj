import React from 'react';
import type { SearchFilters } from '@/lib/types/search';

interface PriceRangeFilterProps {
  minPrice?: number;
  maxPrice?: number;
  onChange: (key: keyof SearchFilters, value: number) => void;
}

export function PriceRangeFilter({ minPrice, maxPrice, onChange }: PriceRangeFilterProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">Price Range</label>
      <div className="mt-2 flex gap-4">
        <input
          type="number"
          placeholder="Min"
          value={minPrice || ''}
          onChange={(e) => onChange('minPrice', Number(e.target.value))}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        <input
          type="number"
          placeholder="Max"
          value={maxPrice || ''}
          onChange={(e) => onChange('maxPrice', Number(e.target.value))}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}