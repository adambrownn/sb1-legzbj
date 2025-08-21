import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePropertyStore } from '@/lib/store/property-store';
import { ImageCarousel } from '@/components/properties/image-carousel';
import { Button } from '@/components/ui/button';
import { useCurrencyStore } from '@/lib/store/currency-store';
import { MapPin, Bed, Bath, Users, ArrowLeft, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export function PropertyDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { properties, loadProperties, isLoading } = usePropertyStore();
  const { formatPrice } = useCurrencyStore();
  const [isImageHovered, setIsImageHovered] = React.useState(false);

  React.useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  // Find the property by id
  const property = properties.find(p => p.id === id);

  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-6 w-1/2" />
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            </div>
            <div className="lg:col-span-1">
              <Skeleton className="h-[200px] w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show not found state
  if (!property) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg bg-red-50 p-6 text-center">
          <h2 className="mb-4 text-xl font-semibold text-red-800">Property Not Found</h2>
          <p className="mb-4 text-red-600">The property you're looking for doesn't exist or has been removed.</p>
          <Button
            variant="outline"
            onClick={() => navigate('/properties')}
            className="inline-flex items-center"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Properties
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      {/* Property Title and Rating */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{property.title}</h1>
          <div className="mt-2 flex items-center text-gray-600">
            <MapPin className="mr-1 h-4 w-4" />
            <span>{property.location.address}</span>
          </div>
        </div>
        {property.rating && (
          <div className="flex items-center rounded-lg bg-blue-50 px-3 py-1">
            <Star className="mr-1 h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{property.rating}</span>
            <span className="ml-1 text-sm text-gray-500">
              ({property.reviews?.length || 0} reviews)
            </span>
          </div>
        )}
      </div>

      {/* Property Images */}
      <div 
        className="mb-8 overflow-hidden rounded-xl"
        onMouseEnter={() => setIsImageHovered(true)}
        onMouseLeave={() => setIsImageHovered(false)}
      >
        <ImageCarousel
          images={property.images}
          title={property.title}
          isHovered={isImageHovered}
        />
      </div>

      {/* Property Details */}
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* Main Info */}
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">About this property</h2>
            <p className="text-gray-600">{property.description}</p>
          </section>

          {/* Amenities */}
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">What this place offers</h2>
            <div className="grid grid-cols-2 gap-4">
              {property.amenities?.map((amenity) => (
                <div key={amenity} className="flex items-center text-gray-600">
                  <span className="mr-2">•</span>
                  {amenity}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Booking Card */}
        <div className="lg:col-span-1">
          <div className="sticky top-4 rounded-xl border bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-gray-900">
                {formatPrice(property.price)}
              </span>
              <span className="text-gray-600">per night</span>
            </div>

            <div className="mb-6 grid grid-cols-3 gap-4 rounded-lg border-t border-b py-4">
              <div className="text-center">
                <Bed className="mx-auto h-5 w-5 text-gray-600" />
                <span className="mt-1 block text-sm">{property.bedrooms} Beds</span>
              </div>
              <div className="text-center">
                <Bath className="mx-auto h-5 w-5 text-gray-600" />
                <span className="mt-1 block text-sm">{property.bathrooms} Baths</span>
              </div>
              <div className="text-center">
                <Users className="mx-auto h-5 w-5 text-gray-600" />
                <span className="mt-1 block text-sm">{property.maxGuests} Guests</span>
              </div>
            </div>

            <Button className="w-full" size="lg">
              Book Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}