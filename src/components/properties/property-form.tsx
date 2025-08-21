import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useDropzone } from 'react-dropzone';
import { Bed, Bath, Users, Plus, X, DollarSign, Calendar, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { propertySchema } from '@/lib/validations/property';
import { usePropertyStore } from '@/lib/store/property-store';
import { useAuthStore } from '@/lib/store/auth-store';
import { AMENITIES } from '@/lib/constants';
import type { Property, PropertyMedia, PropertyAmenity, PropertyLocation, PropertyPricing } from '@/types/property';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';

interface PropertyFormProps {
  property?: Property;
  onSuccess?: () => void;
}

export function PropertyForm({ property, onSuccess }: PropertyFormProps) {
  const { user } = useAuthStore();
  const { addProperty, updateProperty } = usePropertyStore();
  const [media, setMedia] = React.useState<PropertyMedia[]>(property?.media || []);
  const [uploadProgress, setUploadProgress] = React.useState<{ [key: string]: number }>({});
  const [isUploading, setIsUploading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    reset,
    control,
  } = useForm({
    resolver: zodResolver(propertySchema),
    defaultValues: property || {
      title: '',
      description: '',
      type: 'apartment',
      media: [],
      amenities: [],
      location: {
        address: '',
        latitude: 0,
        longitude: 0,
      },
      pricing: {
        baseRate: 0,
        cleaningFee: 0,
        serviceFeePercentage: 10,
        taxRate: 0,
        includedGuests: 1,
        extraGuestFee: 0,
      },
      maxGuests: 1,
      bedrooms: 1,
      bathrooms: 1,
      size: 0,
    },
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
      'video/*': ['.mp4', '.webm'],
    },
    maxSize: 10485760, // 10MB
    onDrop: async (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        toast.error('Some files were rejected. Please check file type and size.');
        return;
      }

      setIsUploading(true);
      const newMedia: PropertyMedia[] = [];

      try {
        for (const file of acceptedFiles) {
          const uploadId = crypto.randomUUID();
          setUploadProgress(prev => ({ ...prev, [uploadId]: 0 }));

          // Simulate upload progress
          await new Promise<void>((resolve) => {
            let progress = 0;
            const interval = setInterval(() => {
              progress += 10;
              setUploadProgress(prev => ({ ...prev, [uploadId]: progress }));
              if (progress >= 100) {
                clearInterval(interval);
                resolve();
              }
            }, 200);
          });

          const url = URL.createObjectURL(file);
          newMedia.push({
            id: uploadId,
            type: file.type.startsWith('image/') ? 'image' : 'video',
            url,
            title: file.name,
          });
          
          setUploadProgress(prev => {
            const { [uploadId]: _, ...rest } = prev;
            return rest;
          });
        }

        setMedia(prev => [...prev, ...newMedia]);
        setValue('media', [...watch('media'), ...newMedia]);
        toast.success('Media uploaded successfully!');
      } catch (error) {
        toast.error('Failed to upload media');
      } finally {
        setIsUploading(false);
      }
    },
  });

  const onSubmit = async (data: any) => {
    if (!user) return;

    try {
      const propertyData: Partial<Property> = {
        ...data,
        hostId: user.id,
      };

      if (property) {
        await updateProperty(property.id, propertyData);
        toast.success('Property updated successfully!');
      } else {
        await addProperty(propertyData);
        toast.success('Property added successfully!');
        reset();
        setMedia([]);
      }
      
      onSuccess?.();
    } catch (error) {
      toast.error(property ? 'Failed to update property' : 'Failed to add property');
    }
  };

  const removeMedia = (id: string) => {
    const newMedia = media.filter(item => item.id !== id);
    setMedia(newMedia);
    setValue('media', newMedia);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Basic Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <Input {...register('title')} error={errors.title?.message} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Textarea {...register('description')} error={errors.description?.message} rows={4} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Property Type</label>
            <Select
              {...register('type')}
              error={errors.type?.message}
              options={[
                { value: 'apartment', label: 'Apartment' },
                { value: 'house', label: 'House' },
                { value: 'villa', label: 'Villa' },
                { value: 'room', label: 'Room' },
              ]}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                <Users className="inline-block w-4 h-4 mr-1" />
                Max Guests
              </label>
              <Input
                type="number"
                min="1"
                {...register('maxGuests')}
                error={errors.maxGuests?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                <Bed className="inline-block w-4 h-4 mr-1" />
                Bedrooms
              </label>
              <Input
                type="number"
                min="1"
                {...register('bedrooms')}
                error={errors.bedrooms?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                <Bath className="inline-block w-4 h-4 mr-1" />
                Bathrooms
              </label>
              <Input
                type="number"
                min="1"
                {...register('bathrooms')}
                error={errors.bathrooms?.message}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Size (sq ft)</label>
            <Input
              type="number"
              min="0"
              {...register('size')}
              error={errors.size?.message}
            />
          </div>
        </div>
      </Card>

      {/* Media Upload */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Photos & Videos</h3>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-500'
          }`}
        >
          <input {...getInputProps()} />
          <div className="space-y-2">
            <Plus className="mx-auto h-12 w-12 text-gray-400" />
            <p className="text-sm text-gray-600">
              {isDragActive
                ? 'Drop the files here...'
                : 'Drag & drop files here, or click to select files'}
            </p>
            <p className="text-xs text-gray-500">
              Supports images (PNG, JPG, WEBP) and videos (MP4, WEBM) up to 10MB
            </p>
          </div>
        </div>

        {isUploading && (
          <div className="mt-4 space-y-2">
            {Object.entries(uploadProgress).map(([id, progress]) => (
              <div key={id} className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block text-blue-600">
                      Uploading...
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold inline-block text-blue-600">
                      {progress}%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                  <div
                    style={{ width: `${progress}%` }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-200"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {media.length > 0 && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {media.map((item) => (
              <div key={item.id} className="relative group">
                {item.type === 'image' ? (
                  <img
                    src={item.url}
                    alt={item.title || ''}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                ) : (
                  <video
                    src={item.url}
                    className="w-full h-32 object-cover rounded-lg"
                    controls
                  />
                )}
                <button
                  type="button"
                  onClick={() => removeMedia(item.id)}
                  className="absolute top-2 right-2 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Location */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">
          <MapPin className="inline-block w-5 h-5 mr-2" />
          Location
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <Input {...register('location.address')} error={errors.location?.address?.message} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Latitude</label>
              <Input
                type="number"
                step="any"
                {...register('location.latitude')}
                error={errors.location?.latitude?.message}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Longitude</label>
              <Input
                type="number"
                step="any"
                {...register('location.longitude')}
                error={errors.location?.longitude?.message}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Pricing */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">
          <DollarSign className="inline-block w-5 h-5 mr-2" />
          Pricing
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Base Rate (per night)</label>
              <Input
                type="number"
                min="0"
                {...register('pricing.baseRate')}
                error={errors.pricing?.baseRate?.message}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Cleaning Fee</label>
              <Input
                type="number"
                min="0"
                {...register('pricing.cleaningFee')}
                error={errors.pricing?.cleaningFee?.message}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Service Fee (%)</label>
              <Input
                type="number"
                min="0"
                max="100"
                {...register('pricing.serviceFeePercentage')}
                error={errors.pricing?.serviceFeePercentage?.message}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tax Rate (%)</label>
              <Input
                type="number"
                min="0"
                max="100"
                {...register('pricing.taxRate')}
                error={errors.pricing?.taxRate?.message}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Included Guests</label>
              <Input
                type="number"
                min="1"
                {...register('pricing.includedGuests')}
                error={errors.pricing?.includedGuests?.message}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Extra Guest Fee</label>
              <Input
                type="number"
                min="0"
                {...register('pricing.extraGuestFee')}
                error={errors.pricing?.extraGuestFee?.message}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Amenities */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Amenities</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {AMENITIES.map((amenity) => (
            <div key={amenity.id} className="flex items-center space-x-2">
              <Switch
                {...register(`amenities.${amenity.id}`)}
                defaultChecked={property?.amenities.some(a => a.id === amenity.id)}
              />
              <label className="text-sm">{amenity.name}</label>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => reset()}
          disabled={isSubmitting}
        >
          Reset
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : property ? 'Update Property' : 'Add Property'}
        </Button>
      </div>
    </form>
  );
}