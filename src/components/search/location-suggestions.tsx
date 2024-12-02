import React from 'react';
import { MapPin } from 'lucide-react';
import type { LocationSuggestion } from '@/lib/types/search';

interface LocationSuggestionsProps {
  suggestions: LocationSuggestion[];
  onSelect: (suggestion: LocationSuggestion) => void;
}

export function LocationSuggestions({ suggestions, onSelect }: LocationSuggestionsProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border bg-white py-2 shadow-lg">
      {suggestions.map((suggestion) => (
        <button
          key={suggestion.id}
          onClick={() => onSelect(suggestion)}
          className="flex w-full items-center px-4 py-2 text-left hover:bg-gray-50"
        >
          <MapPin className="mr-2 h-4 w-4 text-gray-400" />
          <div>
            <p className="font-medium text-gray-900">{suggestion.name}</p>
            <p className="text-sm text-gray-500 capitalize">{suggestion.type}</p>
          </div>
        </button>
      ))}
    </div>
  );
}