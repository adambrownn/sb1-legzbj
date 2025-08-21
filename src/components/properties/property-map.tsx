import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { Icon, LatLngExpression } from 'leaflet';
import type { PropertyLocation, NearbyPlace } from '@/types/property';
import { cn } from '@/lib/utils';
import 'leaflet/dist/leaflet.css';

interface PropertyMapProps {
  location: PropertyLocation;
  nearbyPlaces?: NearbyPlace[];
  className?: string;
}

const customIcon = new Icon({
  iconUrl: '/markers/property-marker.svg',
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -35],
});

const placeIcon = new Icon({
  iconUrl: '/markers/place-marker.svg',
  iconSize: [25, 25],
  iconAnchor: [12, 25],
  popupAnchor: [0, -25],
});

export function PropertyMap({ location, nearbyPlaces = [], className }: PropertyMapProps) {
  const center: LatLngExpression = [location.latitude, location.longitude];
  const walkingRadius = 1000; // 1km radius

  return (
    <div className={cn('relative h-[400px] w-full rounded-lg overflow-hidden', className)}>
      <MapContainer
        center={center}
        zoom={15}
        className="h-full w-full"
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Property Marker */}
        <Marker position={center} icon={customIcon}>
          <Popup>
            <div className="p-2">
              <h3 className="font-semibold">{location.address}</h3>
              {location.description && (
                <p className="mt-1 text-sm text-gray-600">{location.description}</p>
              )}
            </div>
          </Popup>
        </Marker>

        {/* Nearby Places Markers */}
        {nearbyPlaces.map((place) => (
          <Marker key={place.id} position={[place.latitude, place.longitude]} icon={placeIcon}>
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold">{place.name}</h3>
                {place.description && (
                  <p className="mt-1 text-sm text-gray-600">{place.description}</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Walking Radius Circle */}
        <Circle
          center={center}
          radius={walkingRadius}
          pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1 }}
        />
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 z-[400] rounded-lg bg-white p-3 shadow-lg">
        <h4 className="mb-2 text-sm font-semibold">Legend</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <img src="/markers/property-marker.svg" alt="Property" className="h-5 w-5" />
            <span className="text-sm">Property Location</span>
          </div>
          <div className="flex items-center gap-2">
            <img src="/markers/place-marker.svg" alt="Nearby Place" className="h-4 w-4" />
            <span className="text-sm">Nearby Places</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-blue-500/20 ring-1 ring-blue-500" />
            <span className="text-sm">Walking Distance (1km)</span>
          </div>
        </div>
      </div>
    </div>
  );
}