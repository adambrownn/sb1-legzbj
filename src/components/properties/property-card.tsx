import React from 'react';
import { MapPin, Edit2, Trash2, Star, Heart, Bed, Bath, Users } from 'lucide-react';
import { toast } from 'sonner';
import type { Property } from '@/lib/store/property-store';
import { useCurrencyStore } from '@/lib/store/currency-store';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { PropertyForm } from './property-form';
import { ImageCarousel } from './image-carousel'; // Import the new ImageCarousel component
import { cn } from '@/lib/utils';

interface PropertyCardProps {
  property: Property;
  onEdit: (property: Property) => void;
  onDelete: (id: string) => void;
  isFeatured?: boolean;
}

export function PropertyCard({ property, onEdit, onDelete, isFeatured }: PropertyCardProps) {
  const [showEditDialog, setShowEditDialog] = React.useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);
  const { formatPrice } = useCurrencyStore();

  const handleDelete = () => {
    onDelete(property.id);
    setShowDeleteDialog(false);
    toast.success('Property deleted successfully');
  };

  return (
    <>
      <div 
        className={cn(
          "group relative overflow-hidden rounded-xl bg-white shadow-md transition-all duration-300",
          "hover:shadow-lg hover:-translate-y-1",
          isFeatured && "ring-2 ring-blue-500"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Featured Badge */}
        {isFeatured && (
          <div className="absolute left-4 top-4 z-10 rounded-full bg-blue-500 px-3 py-1 text-xs font-semibold text-white shadow-md">
            Featured
          </div>
        )}

        {/* Image Section */}
        <div className="relative">
          {property.images && property.images.length > 0 && (
            <ImageCarousel
              images={property.images}
              title={property.title}
              isHovered={isHovered}
            />
          )}
          
          {/* Action Buttons */}
          <div className="absolute right-2 top-2 flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="opacity-0 transition-opacity group-hover:opacity-100"
              onClick={() => setShowEditDialog(true)}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="opacity-0 transition-opacity group-hover:opacity-100"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Save Button */}
          <Button
            size="sm"
            variant="ghost"
            className="absolute right-2 top-2 text-white hover:text-red-500"
            onClick={(e) => {
              e.stopPropagation();
              toast.success('Property saved to favorites');
            }}
          >
            <Heart className={cn("h-5 w-5 transition-colors", isHovered && "fill-current")} />
          </Button>
        </div>

        {/* Content Section */}
        <div className="p-4">
          {/* Title and Price */}
          <div className="mb-3 flex items-start justify-between">
            <h3 className="text-lg font-semibold line-clamp-2">{property.title}</h3>
            <p className="ml-2 whitespace-nowrap text-lg font-bold text-blue-600">
              {formatPrice(property.price)}
            </p>
          </div>

          {/* Location */}
          <div className="mb-3 flex items-center text-gray-500">
            <MapPin className="mr-1 h-4 w-4" />
            <p className="text-sm line-clamp-1">{property.location.address}</p>
          </div>

          {/* Property Details */}
          <div className="flex items-center justify-between border-t pt-3 text-sm text-gray-600">
            <div className="flex items-center">
              <Bed className="mr-1 h-4 w-4" />
              <span>{property.bedrooms} Beds</span>
            </div>
            <div className="flex items-center">
              <Bath className="mr-1 h-4 w-4" />
              <span>{property.bathrooms} Baths</span>
            </div>
            <div className="flex items-center">
              <Users className="mr-1 h-4 w-4" />
              <span>{property.maxGuests} Guests</span>
            </div>
          </div>

          {/* Rating */}
          {property.rating && (
            <div className="mt-3 flex items-center border-t pt-3">
              <Star className="mr-1 h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{property.rating}</span>
              <span className="ml-1 text-sm text-gray-500">
                ({property.reviews?.length || 0} reviews)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog
        open={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        title="Edit Property"
      >
        <PropertyForm
          property={property}
          onSuccess={() => {
            setShowEditDialog(false);
            toast.success('Property updated successfully');
          }}
        />
      </Dialog>

      {/* Delete Dialog */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        title="Delete Property"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete this property? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Property
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}