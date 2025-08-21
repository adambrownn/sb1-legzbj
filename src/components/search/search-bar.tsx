import React from "react";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PromotionalProperty } from "@/types/promotion";
import { MOCK_PROMOTIONS } from "@/data/promotions";
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface SearchBarProps {
  onSearch: (query: string, checkInDate: Date | null, checkOutDate: Date | null, guests: number) => void;
  placeholder?: string;
  className?: string;
}

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'property' | 'location';
}

export function SearchBar({
  onSearch,
  placeholder = "Search for places...",
  className = "",
}: SearchBarProps) {
  const [query, setQuery] = React.useState("");
  const [checkInDate, setCheckInDate] = React.useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = React.useState<Date | null>(null);
  const [guests, setGuests] = React.useState('');
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const suggestionRef = React.useRef<HTMLDivElement>(null);

  // In a real app, this would be an API call
  const { data: properties } = useQuery<PromotionalProperty[]>({
    queryKey: ["properties"],
    queryFn: () => Promise.resolve(MOCK_PROMOTIONS),
  });

  const getSuggestions = (searchQuery: string): SearchSuggestion[] => {
    if (!searchQuery.trim() || !properties) return [];

    const suggestions: SearchSuggestion[] = [];
    const lowercaseQuery = searchQuery.toLowerCase();

    // Add property name suggestions
    properties.forEach((property) => {
      if (property.name.toLowerCase().includes(lowercaseQuery)) {
        suggestions.push({
          id: `property-${property.id}`,
          text: property.name,
          type: 'property'
        });
      }
      
      // Add location suggestions
      if (property.location.toLowerCase().includes(lowercaseQuery)) {
        const existingLocation = suggestions.find(
          (s) => s.type === 'location' && s.text === property.location
        );
        if (!existingLocation) {
          suggestions.push({
            id: `location-${property.id}`,
            text: property.location,
            type: 'location'
          });
        }
      }
    });

    return suggestions.slice(0, 5); // Limit to 5 suggestions
  };

  const saveSearchPreference = (searchQuery: string) => {
    localStorage.setItem('lastSearch', searchQuery);
  };

  const handleSearch = () => {
    saveSearchPreference(query);
    onSearch(query, checkInDate, checkOutDate, guests === '' ? 1 : Number(guests));
    setShowSuggestions(false);
  };

  const handleSearchClick = () => {
    onSearch(query, checkInDate, checkOutDate, guests === '' ? 1 : Number(guests));
  };

  const handleGuestChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setGuests(value === '' ? '' : Number(value));
  };

  return (
    <div className={`search-bar ${className} flex items-center justify-between bg-white rounded-full shadow-md overflow-hidden`}>  
      <div className="flex items-center border-r px-4">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          placeholder="Destination"
          className="w-full p-2 text-sm focus:outline-none"
        />
      </div>
      <div className="flex items-center border-r px-4">
        <DatePicker
          selected={checkInDate}
          onChange={(date) => setCheckInDate(date)}
          placeholderText="Check-in"
          className="w-full p-2 text-sm focus:outline-none"
        />
      </div>
      <div className="flex items-center border-r px-4">
        <DatePicker
          selected={checkOutDate}
          onChange={(date) => setCheckOutDate(date)}
          placeholderText="Check-out"
          className="w-full p-2 text-sm focus:outline-none"
        />
      </div>
      <div className="flex items-center px-4">
        <input
          type="number"
          value={guests}
          onChange={handleGuestChange}
          min="1"
          placeholder="Guests"
          className="w-full p-2 text-sm focus:outline-none"
        />
      </div>
      <button
        onClick={handleSearchClick}
        className="p-2 bg-blue-500 text-white rounded-full mr-1"
      >
        <Search className="h-4 w-4" />
      </button>
      {showSuggestions && query && (
        <div className="absolute left-0 right-0 z-10 mt-1 max-h-40 overflow-y-auto rounded-md bg-white shadow-lg">
          {getSuggestions(query).map((suggestion) => (
            <div
              key={suggestion.id}
              className="cursor-pointer px-4 py-2 hover:bg-gray-100"
              onClick={() => {
                setQuery(suggestion.text);
                handleSearch();
              }}
            >
              {suggestion.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
