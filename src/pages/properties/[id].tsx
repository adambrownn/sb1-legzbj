import React from 'react';
import { useParams } from 'react-router-dom';
import type { Property } from '@/types/property';
import { ImageCarousel } from '@/components/properties/image-carousel';
import { PropertyMap } from '@/components/properties/property-map';
import { AmenitiesGrid } from '@/components/properties/amenities-grid';
import { PricingBreakdown } from '@/components/properties/pricing-breakdown';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mockProperty } from '@/lib/mock-data';

// Separate components for better organization
const PropertyHeader = ({ property }: { property: Property }) => (
  <div className="mb-8">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{property.title}</h1>
        <PropertyRating rating={property.rating} />
      </div>
      <Badge variant="secondary" className="text-lg">
        ${property.pricing.baseRate}/night
      </Badge>
    </div>
    <p className="mt-2 text-gray-600">{property.description}</p>
    <PropertyStats property={property} />
  </div>
);

const PropertyStats = ({ property }: { property: Property }) => (
  <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
    <span>{property.bedrooms} Bedrooms</span>
    <span>•</span>
    <span>{property.bathrooms} Bathrooms</span>
    <span>•</span>
    <span>Up to {property.maxGuests} guests</span>
    <span>•</span>
    <span>{property.size}m²</span>
  </div>
);

const PropertyRating = ({ rating }: { rating?: Property['rating'] }) => {
  if (!rating) return null;
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center">
        <span className="text-yellow-400">★</span>
        <span className="ml-1 font-medium">{rating.average.toFixed(1)}</span>
      </div>
      <span className="text-gray-500">({rating.count} reviews)</span>
    </div>
  );
};

const BookingForm = ({
  property,
  selectedNights,
  selectedGuests,
  onNightsChange,
  onGuestsChange,
}: {
  property: Property;
  selectedNights: number;
  selectedGuests: number;
  onNightsChange: (nights: number) => void;
  onGuestsChange: (guests: number) => void;
}) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="text-sm font-medium text-gray-700">Nights</label>
        <select
          value={selectedNights}
          onChange={(e) => onNightsChange(Number(e.target.value))}
          className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
        >
          {Array.from({ length: 30 }, (_, i) => i + 1).map((num) => (
            <option key={num} value={num}>
              {num} night{num > 1 ? 's' : ''}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700">Guests</label>
        <select
          value={selectedGuests}
          onChange={(e) => onGuestsChange(Number(e.target.value))}
          className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
        >
          {Array.from({ length: property.maxGuests }, (_, i) => i + 1).map((num) => (
            <option key={num} value={num}>
              {num} guest{num > 1 ? 's' : ''}
            </option>
          ))}
        </select>
      </div>
    </div>
    <Button className="w-full">Book Now</Button>
  </div>
);

const CancellationPolicy = ({ policy }: { policy?: string }) => {
  if (!policy) return null;
  return (
    <div className="mt-4 rounded-lg border border-gray-200 p-4">
      <h3 className="font-medium text-gray-900">Cancellation Policy</h3>
      <p className="mt-1 text-sm text-gray-600">{policy}</p>
    </div>
  );
};

const BookingSection = ({ property, selectedNights, selectedGuests, onNightsChange, onGuestsChange }: {
  property: Property;
  selectedNights: number;
  selectedGuests: number;
  onNightsChange: (nights: number) => void;
  onGuestsChange: (guests: number) => void;
}) => (
  <div className="sticky top-8 space-y-6 rounded-xl border bg-white p-6 shadow-sm">
    <PricingBreakdown
      pricing={property.pricing}
      nights={selectedNights}
      guests={selectedGuests}
    />
    <BookingForm
      property={property}
      selectedNights={selectedNights}
      selectedGuests={selectedGuests}
      onNightsChange={onNightsChange}
      onGuestsChange={onGuestsChange}
    />
    <CancellationPolicy policy={property.pricing.cancellationPolicy} />
  </div>
);

export function PropertyDetailsPage() {
  const { id } = useParams();
  const [property, setProperty] = React.useState<Property | null>(null);
  const [selectedNights, setSelectedNights] = React.useState(1);
  const [selectedGuests, setSelectedGuests] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchProperty = async () => {
      try {
        setIsLoading(true);
        setProperty(mockProperty);
      } catch (error) {
        console.error('Error fetching property:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperty();
  }, [id]);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!property) {
    return <div className="flex h-screen items-center justify-center">Property not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative h-[60vh] w-full">
        <ImageCarousel media={property.media} />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PropertyHeader property={property} />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="mb-4 text-2xl font-semibold">Amenities</h2>
              <AmenitiesGrid amenities={property.amenities} />
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold">Location</h2>
              <div className="overflow-hidden rounded-lg">
                <PropertyMap
                  location={property.location}
                  nearbyPlaces={property.location.nearbyPlaces}
                  className="h-[400px] w-full"
                />
              </div>
              <p className="mt-4 text-gray-600">{property.location.description}</p>
            </section>
          </div>

          <div className="lg:col-span-1">
            <BookingSection
              property={property}
              selectedNights={selectedNights}
              selectedGuests={selectedGuests}
              onNightsChange={setSelectedNights}
              onGuestsChange={setSelectedGuests}
            />
          </div>
        </div>
      </div>
    </div>
  );
}