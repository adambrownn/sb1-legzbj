import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import { Utensils, Coffee, Landmark } from 'lucide-react';
import type { LocalInsight } from '@/lib/types/local-insight';

interface InsightMapProps {
  propertyLocation: {
    latitude: number;
    longitude: number;
  };
  insights: LocalInsight[];
  hoveredInsight: string | null;
  onMarkerHover: (id: string | null) => void;
}

const ICON_CONFIGS = {
  restaurant: { icon: Utensils, color: '#EF4444' },
  cafe: { icon: Coffee, color: '#F59E0B' },
  attraction: { icon: Landmark, color: '#3B82F6' },
};

export function InsightMap({
  propertyLocation,
  insights,
  hoveredInsight,
  onMarkerHover,
}: InsightMapProps) {
  return (
    <div className="h-[400px] overflow-hidden rounded-lg border">
      <MapContainer
        center={[propertyLocation.latitude, propertyLocation.longitude]}
        zoom={15}
        className="h-full w-full"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Property Marker */}
        <Marker
          position={[propertyLocation.latitude, propertyLocation.longitude]}
          icon={new Icon({
            iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
          })}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-medium">Property Location</h3>
            </div>
          </Popup>
        </Marker>

        {/* Insight Markers */}
        {insights.map((insight) => (
          <Marker
            key={insight.id}
            position={[insight.location.latitude, insight.location.longitude]}
            icon={new Icon({
              iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
              iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
              shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              className: hoveredInsight === insight.id ? 'marker-highlighted' : '',
            })}
            eventHandlers={{
              mouseover: () => onMarkerHover(insight.id),
              mouseout: () => onMarkerHover(null),
            }}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-medium">{insight.name}</h3>
                <p className="text-sm text-gray-600">{insight.distance} miles away</p>
                {insight.openingHours && (
                  <p className="mt-1 text-sm text-gray-600">{insight.openingHours}</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}