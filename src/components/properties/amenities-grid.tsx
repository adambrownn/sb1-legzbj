import React from 'react';
import { Check, Info } from 'lucide-react';
import type { PropertyAmenity } from '@/types/property';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface AmenitiesGridProps {
  amenities: PropertyAmenity[];
  className?: string;
}

type AmenityCategory = 'essential' | 'comfort' | 'safety' | 'outdoor' | 'entertainment';

const categoryLabels: Record<AmenityCategory, string> = {
  essential: 'Essential',
  comfort: 'Comfort & Convenience',
  safety: 'Safety & Security',
  outdoor: 'Outdoor',
  entertainment: 'Entertainment',
};

export function AmenitiesGrid({ amenities, className }: AmenitiesGridProps) {
  const [selectedCategory, setSelectedCategory] = React.useState<AmenityCategory | 'all'>('all');
  const [showAll, setShowAll] = React.useState(false);

  const categories = Array.from(
    new Set(amenities.map((amenity) => amenity.category))
  ) as AmenityCategory[];

  const filteredAmenities = React.useMemo(() => {
    let filtered = amenities;
    if (selectedCategory !== 'all') {
      filtered = amenities.filter((amenity) => amenity.category === selectedCategory);
    }
    return showAll ? filtered : filtered.slice(0, 8);
  }, [amenities, selectedCategory, showAll]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('all')}
        >
          All
        </Button>
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category)}
          >
            {categoryLabels[category]}
          </Button>
        ))}
      </div>

      {/* Amenities Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {filteredAmenities.map((amenity) => (
          <TooltipProvider key={amenity.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-gray-50">
                  {amenity.icon && (
                    <img
                      src={amenity.icon}
                      alt={amenity.name}
                      className="h-5 w-5 flex-shrink-0"
                    />
                  )}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{amenity.name}</h3>
                      {amenity.isPremium && (
                        <Badge variant="secondary" className="h-5">
                          Premium
                        </Badge>
                      )}
                    </div>
                    {amenity.description && (
                      <p className="text-sm text-gray-500">{amenity.description}</p>
                    )}
                    {amenity.availability && (
                      <p className="text-sm text-gray-500">
                        Available: {amenity.availability}
                      </p>
                    )}
                  </div>
                  {amenity.included && (
                    <Check className="ml-auto h-4 w-4 text-green-500" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" align="center">
                <div className="space-y-2 p-2">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    <span className="font-medium">Details</span>
                  </div>
                  <p className="max-w-xs text-sm">{amenity.details}</p>
                  {amenity.restrictions && (
                    <p className="text-sm text-gray-500">
                      Note: {amenity.restrictions}
                    </p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>

      {/* Show More/Less Button */}
      {amenities.length > 8 && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? 'Show Less' : `Show All (${amenities.length})`}
          </Button>
        </div>
      )}
    </div>
  );
}