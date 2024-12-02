import React from 'react';
import { Wifi, ParkingSquare, Waves, Dumbbell, Wind } from 'lucide-react';
import { AMENITIES } from '@/lib/constants';

interface AmenitiesGridProps {
  amenities: string[];
}

const AMENITY_ICONS = {
  wifi: Wifi,
  parking: ParkingSquare,
  pool: Waves,
  gym: Dumbbell,
  ac: Wind,
} as const;

export function AmenitiesGrid({ amenities }: AmenitiesGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {amenities.map((amenityId) => {
        const amenity = AMENITIES.find((a) => a.id === amenityId);
        if (!amenity) return null;

        const Icon = AMENITY_ICONS[amenityId as keyof typeof AMENITY_ICONS];

        return (
          <div
            key={amenityId}
            className="flex items-center gap-2 rounded-lg border p-3"
          >
            {Icon && <Icon className="h-5 w-5 text-gray-600" />}
            <span className="text-sm text-gray-700">{amenity.name}</span>
          </div>
        );
      })}
    </div>
  );
}