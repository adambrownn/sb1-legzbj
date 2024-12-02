import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import 'leaflet/dist/leaflet.css';
import type { PropertyLocation } from '@/lib/types/property';

interface PropertyMapProps {
  location: PropertyLocation;
  nearbyAttractions?: Array<{
    name: string;
    location: PropertyLocation;
    type: string;
    distance: number;
    rating?: number;
    reviews?: number;
  }>;
}

export function PropertyMap({ location, nearbyAttractions = [] }: PropertyMapProps) {
  const [selectedType, setSelectedType] = React.useState<string | null>(null);
  const attractionTypes = Array.from(
    new Set(nearbyAttractions.map((a) => a.type))
  );

  const filteredAttractions = selectedType
    ? nearbyAttractions.filter((a) => a.type === selectedType)
    : nearbyAttractions;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button
          variant={selectedType === null ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setSelectedType(null)}
        >
          All
        </Button>
        {attractionTypes.map((type) => (
          <Button
            key={type}
            variant={selectedType === type ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedType(type)}
          >
            {type}
          </Button>
        ))}
      </div>

      <div className="h-[400px] overflow-hidden rounded-lg">
        <MapContainer
          center={[location.latitude, location.longitude]}
          zoom={14}
          className="h-full w-full"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          <Marker position={[location.latitude, location.longitude]}>
            <Popup>
              <div className="p-2">
                <h3 className="font-medium">Property Location</h3>
                <p className="text-sm text-gray-600">{location.address}</p>
              </div>
            </Popup>
          </Marker>

          {filteredAttractions.map((attraction, index) => (
            <Marker
              key={index}
              position={[attraction.location.latitude, attraction.location.longitude]}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-medium">{attraction.name}</h3>
                  <p className="text-sm text-gray-600">{attraction.type}</p>
                  {attraction.rating && (
                    <p className="text-sm text-gray-600">
                      Rating: {attraction.rating}/5
                      {attraction.reviews && ` (${attraction.reviews} reviews)`}
                    </p>
                  )}
                  <p className="text-sm text-gray-600">
                    {attraction.distance.toFixed(1)} km away
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}