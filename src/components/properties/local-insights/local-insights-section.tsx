import React from 'react';
import { Utensils, Coffee, MapPin, Landmark } from 'lucide-react';
import { InsightCard } from './insight-card';
import { InsightMap } from './insight-map';
import type { LocalInsight, InsightType } from '@/lib/types/local-insight';

const CATEGORIES = [
  {
    id: 'restaurant' as InsightType,
    label: 'Restaurants',
    description: 'Popular dining spots nearby',
    icon: Utensils,
  },
  {
    id: 'cafe' as InsightType,
    label: 'Cafes',
    description: 'Cozy spots for coffee and snacks',
    icon: Coffee,
  },
  {
    id: 'attraction' as InsightType,
    label: 'Attractions',
    description: 'Must-visit places in the area',
    icon: Landmark,
  },
];

// Mock data - In a real app, this would come from an API
const MOCK_INSIGHTS: LocalInsight[] = [
  {
    id: '1',
    name: 'The Local Bistro',
    type: 'restaurant',
    description: 'Farm-to-table restaurant featuring seasonal ingredients',
    rating: 4.8,
    reviews: 245,
    distance: 0.3,
    location: {
      address: '123 Main St',
      latitude: 34.0522,
      longitude: -118.2437,
    },
    priceRange: '$$',
    openingHours: '11:00 AM - 10:00 PM',
    website: 'https://example.com',
  },
  {
    id: '2',
    name: 'Coastal Coffee',
    type: 'cafe',
    description: 'Artisanal coffee shop with ocean views',
    rating: 4.6,
    reviews: 182,
    distance: 0.2,
    location: {
      address: '456 Beach Rd',
      latitude: 34.0523,
      longitude: -118.2438,
    },
    priceRange: '$',
    openingHours: '7:00 AM - 6:00 PM',
  },
  {
    id: '3',
    name: 'City Museum',
    type: 'attraction',
    description: 'Historic museum showcasing local art and culture',
    rating: 4.7,
    reviews: 567,
    distance: 0.8,
    location: {
      address: '789 Culture Ave',
      latitude: 34.0524,
      longitude: -118.2439,
    },
    openingHours: '9:00 AM - 5:00 PM',
    website: 'https://example.com',
  },
];

interface LocalInsightsSectionProps {
  propertyLocation: {
    latitude: number;
    longitude: number;
  };
}

export function LocalInsightsSection({ propertyLocation }: LocalInsightsSectionProps) {
  const [selectedCategory, setSelectedCategory] = React.useState<InsightType | null>(null);
  const [hoveredInsight, setHoveredInsight] = React.useState<string | null>(null);

  const filteredInsights = selectedCategory
    ? MOCK_INSIGHTS.filter((insight) => insight.type === selectedCategory)
    : MOCK_INSIGHTS;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Local Insights</h2>
        <p className="mt-1 text-gray-600">Discover popular spots near your stay</p>
      </div>

      {/* Category Filters */}
      <div className="flex gap-4 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            selectedCategory === null
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <MapPin className="h-4 w-4" />
          All Places
        </button>
        {CATEGORIES.map((category) => {
          const Icon = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              {category.label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Map */}
        <div className="order-2 lg:order-1">
          <InsightMap
            propertyLocation={propertyLocation}
            insights={filteredInsights}
            hoveredInsight={hoveredInsight}
            onMarkerHover={setHoveredInsight}
          />
        </div>

        {/* Insights List */}
        <div className="order-1 space-y-4 lg:order-2">
          {filteredInsights.map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              onHover={() => setHoveredInsight(insight.id)}
              onLeave={() => setHoveredInsight(null)}
              isHovered={hoveredInsight === insight.id}
            />
          ))}
        </div>
      </div>
    </div>
  );
}