import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Star, Users, Bed, Bath } from 'lucide-react';
import { Loader } from '@/components/ui/loader';
import { usePropertyStore } from '@/lib/store/property-store';
import { cn } from '@/lib/utils';

export function FeaturedProperties() {
  const navigate = useNavigate();
  const { properties, isLoading, error, loadProperties } = usePropertyStore();
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);

  React.useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  const handlePropertyClick = (propertyId: string) => {
    navigate(`/properties/${propertyId}`);
  };

  if (error) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader className="h-8 w-8 text-blue-600" />
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
        <p className="text-gray-600">No properties found.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {properties.map((property) => (
        <div
          key={property.id}
          onClick={() => handlePropertyClick(property.id)}
          onMouseEnter={() => setHoveredId(property.id)}
          onMouseLeave={() => setHoveredId(null)}
          className={cn(
            "group relative cursor-pointer overflow-hidden rounded-lg bg-white shadow-md transition-all duration-300",
            hoveredId === property.id ? "scale-[1.02] shadow-xl" : "hover:shadow-lg"
          )}
        >
          {/* Image Container */}
          <div className="relative h-48 overflow-hidden">
            <img
              src={property.images[0]}
              alt={property.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </div>

          {/* Content */}
          <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600">
              {property.title}
            </h3>
            
            <div className="mt-2 flex items-center text-gray-500">
              <MapPin className="mr-2 h-4 w-4" />
              {property.location}
            </div>

            {/* Property Details */}
            <div className="mt-4 flex items-center gap-4 text-gray-500">
              <div className="flex items-center">
                <Users className="mr-1 h-4 w-4" />
                <span>{property.maxGuests} guests</span>
              </div>
              <div className="flex items-center">
                <Bed className="mr-1 h-4 w-4" />
                <span>{property.bedrooms} beds</span>
              </div>
              <div className="flex items-center">
                <Bath className="mr-1 h-4 w-4" />
                <span>{property.bathrooms} baths</span>
              </div>
            </div>

            {/* Price */}
            <div className="mt-4 flex items-center justify-between">
              <div className="text-right">
                <span className="text-lg font-bold text-gray-900">${property.price}</span>
                <span className="text-gray-500">/night</span>
              </div>
            </div>

            {/* Hover Overlay */}
            <div className="absolute inset-x-0 bottom-0 h-1 bg-blue-600 transform scale-x-0 transition-transform duration-300 group-hover:scale-x-100" />
          </div>
        </div>
      ))}
    </div>
  );
}