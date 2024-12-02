import React from 'react';
import { X } from 'lucide-react';
import { PriceRangeFilter } from './price-range-filter';
import { PropertyTypeFilter } from './property-type-filter';
import { AmenitiesFilter } from './amenities-filter';
import { GuestCapacityFilter } from './guest-capacity-filter';
import { PetFriendlyFilter } from './pet-friendly-filter';
import type { SearchFilters } from '@/lib/types/search';
import type { PropertyType } from '@/lib/types/property';

interface SearchFiltersProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
  onClose: () => void;
}

export function SearchFilters({ filters, onChange, onClose }: SearchFiltersProps) {
  const handleChange = (key: keyof SearchFilters, value: any) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="rounded-lg border bg-white p-4 shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Filters</h3>
        <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-6">
        <PriceRangeFilter
          minPrice={filters.minPrice}
          maxPrice={filters.maxPrice}
          onChange={handleChange}
        />

        <PropertyTypeFilter
          selected={filters.propertyType}
          onChange={(type: PropertyType) => handleChange('propertyType', type)}
        />

        <AmenitiesFilter
          selected={filters.amenities || []}
          onChange={(amenities) => handleChange('amenities', amenities)}
        />

        <GuestCapacityFilter
          value={filters.guestCapacity}
          onChange={(value) => handleChange('guestCapacity', value)}
        />

        <PetFriendlyFilter
          checked={filters.petFriendly || false}
          onChange={(checked) => handleChange('petFriendly', checked)}
        />
      </div>
    </div>
  );
}