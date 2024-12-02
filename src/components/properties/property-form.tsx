import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useDropzone } from 'react-dropzone';
import { Bed, Bath, Users, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { propertySchema } from '@/lib/validations/property';
import { usePropertyStore } from '@/lib/store/property-store';
import { useAuthStore } from '@/lib/store/auth-store';
import { AMENITIES } from '@/lib/constants';
import type { Property } from '@/lib/store/property-store';

interface PropertyFormProps {
  property?: Property;
  onSuccess?: () => void;
}

export function PropertyForm({ property, onSuccess }: PropertyFormProps) {
  const { user } = useAuthStore();
  const { addProperty, updateProperty } = usePropertyStore();
  const [images, setImages] = React.useState<string[]>(property?.images || []);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm({
    resolver: zodResolver(propertySchema),
    defaultValues: property || {
      images: [],
      amenities: [],
      maxGuests: 1,
      bedrooms: 1,
      bathrooms: 1,
    },
  });

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
    },
    onDrop: (acceptedFiles) => {
      const newImages = acceptedFiles.map((file) => URL.createObjectURL(file));
      setImages((prev) => [...prev, ...newImages]);
      setValue('images', [...watch('images'), ...newImages]);
    },
  });

  const onSubmit = (data: any) => {
    if (!user) return;

    try {
      if (property) {
        updateProperty(property.id, data);
      } else {
        addProperty({
          ...data,
          hostId: user.id,
        });
      }
      if (!property) {
        reset();
        setImages([]);
      }
      onSuccess?.();
    } catch (error) {
      toast.error(property ? 'Failed to update property' : 'Failed to add property');
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    setValue('images', newImages);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          {...register('title')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title.message as string}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          {...register('description')}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message as string}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Location</label>
        <input
          {...register('location')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        {errors.location && (
          <p className="mt-1 text-sm text-red-600">{errors.location.message as string}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Price per night</label>
        <input
          {...register('price', { valueAsNumber: true })}
          type="number"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        {errors.price && (
          <p className="mt-1 text-sm text-red-600">{errors.price.message as string}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Images</label>
        <div
          {...getRootProps()}
          className="mt-1 flex justify-center rounded-md border-2 border-dashed border-gray-300 px-6 py-10"
        >
          <input {...getInputProps()} />
          <div className="text-center">
            <Plus className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-1 text-sm text-gray-600">
              Drop images here or click to upload
            </p>
          </div>
        </div>
        {errors.images && (
          <p className="mt-1 text-sm text-red-600">{errors.images.message as string}</p>
        )}
        {images.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-4">
            {images.map((image, index) => (
              <div key={index} className="relative">
                <img
                  src={image}
                  alt={`Property ${index + 1}`}
                  className="h-24 w-full rounded-md object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -right-2 -top-2 rounded-full bg-white p-1 shadow-md"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            <Users className="mr-1 inline-block h-4 w-4" />
            Max Guests
          </label>
          <input
            {...register('maxGuests', { valueAsNumber: true })}
            type="number"
            min="1"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            <Bed className="mr-1 inline-block h-4 w-4" />
            Bedrooms
          </label>
          <input
            {...register('bedrooms', { valueAsNumber: true })}
            type="number"
            min="1"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            <Bath className="mr-1 inline-block h-4 w-4" />
            Bathrooms
          </label>
          <input
            {...register('bathrooms', { valueAsNumber: true })}
            type="number"
            min="1"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Amenities</label>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {AMENITIES.map((amenity) => (
            <label
              key={amenity.id}
              className="flex items-center space-x-2 rounded-md border p-2"
            >
              <input
                type="checkbox"
                value={amenity.id}
                {...register('amenities')}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{amenity.name}</span>
            </label>
          ))}
        </div>
        {errors.amenities && (
          <p className="mt-1 text-sm text-red-600">{errors.amenities.message as string}</p>
        )}
      </div>

      <Button type="submit" className="w-full">
        {property ? 'Update Property' : 'Add Property'}
      </Button>
    </form>
  );
}