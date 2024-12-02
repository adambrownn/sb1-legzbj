import React from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, Users, Bed, Bath, Star } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ImageCarousel } from '@/components/properties/image-carousel';
import { ReviewsSection } from '@/components/reviews/reviews-section';
import { PricingBreakdown } from '@/components/properties/pricing-breakdown';
import { LocalInsights } from '@/components/properties/local-insights';
import { AmenitiesGrid } from '@/components/properties/amenities-grid';
import { BookingModal } from '@/components/bookings/booking-modal';
import { usePropertyStore } from '@/lib/store/property-store';
import { useBookingStore } from '@/lib/store/booking-store';
import { useReviewStore } from '@/lib/store/review-store';
import type { BookingDetails } from '@/lib/types/booking';

export function PropertyDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [showBookingModal, setShowBookingModal] = React.useState(false);
  const property = usePropertyStore((state) =>
    state.properties.find((p) => p.id === id)
  );
  const { addBooking } = useBookingStore();
  const stats = useReviewStore((state) => id ? state.getReviewStats(id) : null);

  if (!property || !id) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-gray-600">Property not found</p>
      </div>
    );
  }

  const handleBookingComplete = (booking: BookingDetails) => {
    addBooking(booking);
    toast.success('Booking confirmed successfully!');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Image Carousel */}
      <ImageCarousel images={property.images} />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">{property.title}</h1>
              <div className="mt-2 flex items-center gap-4 text-gray-600">
                <div className="flex items-center">
                  <MapPin className="mr-1 h-5 w-5" />
                  {property.location}
                </div>
                {stats && (
                  <div className="flex items-center">
                    <Star className="mr-1 h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span>{stats.averageRating.toFixed(1)}</span>
                    <span className="ml-1 text-gray-500">
                      ({stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'})
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Property Details */}
            <div className="mb-8 grid grid-cols-3 gap-4 rounded-lg border bg-white p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium">{property.maxGuests} guests</p>
                  <p className="text-sm text-gray-500">Maximum</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Bed className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium">{property.bedrooms} bedrooms</p>
                  <p className="text-sm text-gray-500">King beds</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Bath className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium">{property.bathrooms} bathrooms</p>
                  <p className="text-sm text-gray-500">Full baths</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold">About this property</h2>
              <p className="text-gray-600">{property.description}</p>
            </div>

            {/* Amenities */}
            <div className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold">Amenities</h2>
              <AmenitiesGrid amenities={property.amenities} />
            </div>

            {/* Reviews */}
            <div className="mb-8">
              <ReviewsSection propertyId={id} />
            </div>

            {/* Local Insights */}
            <div className="mb-8">
              <LocalInsights />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:sticky lg:top-8">
            <PricingBreakdown
              basePrice={property.price}
              nights={7}
              cleaningFee={75}
              serviceFee={45}
            />
            <Button 
              className="mt-4 w-full"
              onClick={() => setShowBookingModal(true)}
            >
              Book Now
            </Button>
          </div>
        </div>
      </div>

      <BookingModal
        property={property}
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        onBookingComplete={handleBookingComplete}
      />
    </div>
  );
}