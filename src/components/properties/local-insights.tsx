import React from 'react';
import { MapPin, Utensils, Coffee, Landmark } from 'lucide-react';

const MOCK_INSIGHTS = [
  {
    category: 'Restaurants',
    icon: Utensils,
    places: [
      { name: 'The Local Bistro', distance: '0.2', rating: 4.5 },
      { name: 'Ocean View Restaurant', distance: '0.5', rating: 4.8 },
    ],
  },
  {
    category: 'Cafes',
    icon: Coffee,
    places: [
      { name: 'Morning Brew', distance: '0.3', rating: 4.6 },
      { name: 'Coastal Coffee', distance: '0.4', rating: 4.4 },
    ],
  },
  {
    category: 'Attractions',
    icon: Landmark,
    places: [
      { name: 'City Museum', distance: '1.0', rating: 4.7 },
      { name: 'Central Park', distance: '0.8', rating: 4.9 },
    ],
  },
];

export function LocalInsights() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Local Insights</h2>
      
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {MOCK_INSIGHTS.map((category) => {
          const Icon = category.icon;
          return (
            <div key={category.category} className="rounded-lg border bg-white p-4">
              <div className="mb-4 flex items-center gap-2">
                <Icon className="h-5 w-5 text-gray-600" />
                <h3 className="font-medium">{category.category}</h3>
              </div>
              
              <div className="space-y-3">
                {category.places.map((place) => (
                  <div key={place.name} className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{place.name}</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin className="mr-1 h-4 w-4" />
                        <span>{place.distance} miles away</span>
                      </div>
                    </div>
                    <div className="rounded-full bg-blue-50 px-2 py-1 text-sm font-medium text-blue-600">
                      {place.rating}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}