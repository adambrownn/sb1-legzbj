import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PropertyForm } from '@/components/properties/property-form';
import { PropertyCard } from '@/components/properties/property-card';
import { usePropertyStore } from '@/lib/store/property-store';
import { useAuthStore } from '@/lib/store/auth-store';

export function HostPropertiesPage() {
  const [showForm, setShowForm] = React.useState(false);
  const { user } = useAuthStore();
  const { getHostProperties, deleteProperty } = usePropertyStore();
  
  const properties = usePropertyStore((state) => 
    user ? state.getHostProperties(user.id) : []
  );

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Properties</h1>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Property
        </Button>
      </div>

      {showForm ? (
        <div className="rounded-lg bg-white p-6 shadow-lg">
          <PropertyForm onSuccess={() => setShowForm(false)} />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              onEdit={(property) => {
                // Handle edit in parent component if needed
              }}
              onDelete={deleteProperty}
            />
          ))}
        </div>
      )}
    </div>
  );
}