import React from 'react';
import { Star, ExternalLink } from 'lucide-react';
import type { LocalInsight } from '@/lib/types/local-insight';

interface InsightCardProps {
  insight: LocalInsight;
  onHover: () => void;
  onLeave: () => void;
  isHovered: boolean;
}

export function InsightCard({ insight, onHover, onLeave, isHovered }: InsightCardProps) {
  return (
    <div
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={`rounded-lg border bg-white p-4 transition-shadow ${
        isHovered ? 'shadow-md' : 'hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-medium">{insight.name}</h3>
          <p className="mt-1 text-sm text-gray-600">{insight.description}</p>
        </div>
        <div className="flex items-center rounded-full bg-blue-50 px-2 py-1">
          <Star className="mr-1 h-4 w-4 fill-blue-600 text-blue-600" />
          <span className="text-sm font-medium text-blue-600">{insight.rating}</span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
        <span>{insight.distance} miles away</span>
        {insight.priceRange && <span>{insight.priceRange}</span>}
        {insight.openingHours && <span>{insight.openingHours}</span>}
      </div>

      {insight.website && (
        <a
          href={insight.website}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          Visit website
          <ExternalLink className="h-4 w-4" />
        </a>
      )}
    </div>
  );
}