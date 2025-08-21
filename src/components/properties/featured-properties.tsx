import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { usePropertyStore } from '@/lib/store/property-store';
import { useCurrencyStore } from '@/lib/store/currency-store';
import { PropertyCard } from './property-card';
import { Button } from '@/components/ui/button';

export function FeaturedProperties() {
  const navigate = useNavigate();
  const { properties, isLoading, error, loadProperties } = usePropertyStore();
  const { formatPrice } = useCurrencyStore();

  React.useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-200" />
          <div className="h-8 w-24 animate-pulse rounded-lg bg-gray-200" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-xl bg-gray-100 p-4">
              <div className="mb-4 h-48 w-full rounded-xl bg-gray-200" />
              <div className="space-y-3">
                <div className="h-6 w-3/4 rounded bg-gray-200" />
                <div className="h-4 w-1/2 rounded bg-gray-200" />
                <div className="flex justify-between">
                  <div className="h-4 w-1/4 rounded bg-gray-200" />
                  <div className="h-4 w-1/4 rounded bg-gray-200" />
                  <div className="h-4 w-1/4 rounded bg-gray-200" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-center text-red-500">
        <p className="font-medium">Failed to load featured properties</p>
        <Button
          variant="ghost"
          className="mt-2 text-red-600"
          onClick={() => loadProperties()}
        >
          Try Again
        </Button>
      </div>
    );
  }

  // Get featured properties (first 3 with highest rating)
  const featuredProperties = properties
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">Featured Properties</h2>
        <Button
          variant="ghost"
          className="text-blue-600"
          onClick={() => navigate('/properties')}
        >
          View All
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {featuredProperties.map((property) => (
          <div
            key={property.id}
            className="cursor-pointer"
            onClick={() => navigate(`/properties/${property.id}`)}
          >
            <PropertyCard
              property={property}
              onEdit={(property) => {
                // Handle edit
              }}
              onDelete={(id) => {
                // Handle delete
              }}
              isFeatured={true}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
