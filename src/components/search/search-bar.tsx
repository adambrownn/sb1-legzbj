import React from 'react';
import { Search, Sliders } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchFilterPanel } from './search-filter-panel';
import { LocationSuggestions } from './location-suggestions';
import { useDebounce } from '@/lib/hooks/use-debounce';
import type { LocationSuggestion, SearchFilters } from '@/lib/types/search';

interface SearchBarProps {
  onSearch: (query: string, filters: SearchFilters) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({
  onSearch,
  placeholder = 'Search for places...',
  className = '',
}: SearchBarProps) {
  const [query, setQuery] = React.useState('');
  const [showFilters, setShowFilters] = React.useState(false);
  const [filters, setFilters] = React.useState<SearchFilters>({});
  const [suggestions, setSuggestions] = React.useState<LocationSuggestion[]>([]);
  const debouncedSearch = useDebounce((value: string) => {
    onSearch(value, filters);
  }, 300);

  const handleQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setQuery(value);
    
    if (value.length >= 2) {
      // Simulate API call for location suggestions
      const mockSuggestions: LocationSuggestion[] = [
        { id: '1', name: 'New York', type: 'city' },
        { id: '2', name: 'Los Angeles', type: 'city' },
        { id: '3', name: 'California', type: 'region' },
      ].filter(s => 
        s.name.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(mockSuggestions);
    } else {
      setSuggestions([]);
    }
    
    debouncedSearch(value);
  };

  const handleSuggestionSelect = (suggestion: LocationSuggestion) => {
    setQuery(suggestion.name);
    setSuggestions([]);
    onSearch(suggestion.name, filters);
  };

  const handleFiltersChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
    onSearch(query, newFilters);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={handleQueryChange}
            placeholder={placeholder}
            className="h-12 w-full rounded-full border border-gray-200 bg-white pl-12 pr-4 text-base placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 sm:h-14 sm:text-lg"
          />
          <LocationSuggestions
            suggestions={suggestions}
            onSelect={handleSuggestionSelect}
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="h-12 gap-2 rounded-full border-gray-200 sm:h-14"
        >
          <Sliders className="h-4 w-4" />
          Filters
        </Button>
      </div>

      {showFilters && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2">
          <SearchFilterPanel
            filters={filters}
            onChange={handleFiltersChange}
            onClose={() => setShowFilters(false)}
          />
        </div>
      )}
    </div>
  );
}