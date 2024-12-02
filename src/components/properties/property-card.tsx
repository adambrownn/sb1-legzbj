import React from 'react';
import { MapPin, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Property } from '@/lib/store/property-store';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { PropertyForm } from './property-form';

interface PropertyCardProps {
  property: Property;
  onEdit: (property: Property) => void;
  onDelete: (id: string) => void;
}

export function PropertyCard({ property, onEdit, onDelete }: PropertyCardProps) {
  const [showEditDialog, setShowEditDialog] = React.useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);

  const handleDelete = () => {
    onDelete(property.id);
    setShowDeleteDialog(false);
    toast.success('Property deleted successfully');
  };

  return (
    <>
      <div className="group overflow-hidden rounded-lg bg-white shadow-md transition-all hover:shadow-lg">
        <div className="relative">
          {property.images[0] && (
            <img
              src={property.images[0]}
              alt={property.title}
              className="h-48 w-full object-cover"
            />
          )}
          <div className="absolute right-2 top-2 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowEditDialog(true)}
              className="gap-1"
            >
              <Edit2 className="h-4 w-4" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowDeleteDialog(true)}
              className="gap-1 bg-red-100 hover:bg-red-200"
            >
              <Trash2 className="h-4 w-4 text-red-600" />
              Delete
            </Button>
          </div>
        </div>
        <div className="p-6">
          <h3 className="text-xl font-semibold text-gray-900">{property.title}</h3>
          <div className="mt-2 flex items-center text-gray-500">
            <MapPin className="mr-2 h-4 w-4" />
            {property.location}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-lg font-bold text-gray-900">
              ${property.price}
              <span className="text-sm font-normal text-gray-500">/night</span>
            </span>
          </div>
        </div>
      </div>

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