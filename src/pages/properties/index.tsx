import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { usePropertyStore } from "@/lib/store/property-store";
import { useCurrencyStore } from "@/lib/store/currency-store";
import { MapPin, Bed, Bath, Users } from "lucide-react";
import { useDebounce } from "@/lib/hooks/use-debounce";

interface Filters {
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
}

export default function PropertiesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { searchQuery = "" } = location.state || {};
  
  const { properties, isLoading, error, loadProperties } = usePropertyStore();
  const { formatPrice } = useCurrencyStore();
  const [filters, setFilters] = React.useState<Filters>({});
  const [localSearchQuery, setLocalSearchQuery] = React.useState(searchQuery);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const debouncedSearchQuery = useDebounce(localSearchQuery, 300);

  React.useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  // Update search suggestions when query changes
  const searchSuggestions = React.useMemo(() => {
    if (!debouncedSearchQuery) return [];
    
    const suggestions = new Set<string>();
    properties.forEach(property => {
      if (property.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase())) {
        suggestions.add(property.title);
      }
      if (property.location.address.toLowerCase().includes(debouncedSearchQuery.toLowerCase())) {
        suggestions.add(property.location.address);
      }
    });
    return Array.from(suggestions).slice(0, 5);
  }, [properties, debouncedSearchQuery]);

  const filteredProperties = React.useMemo(() => {
    return properties.filter((property) => {
      const matchesSearch = 
        property.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        property.location.address.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      
      const matchesType = !filters.propertyType || 
        property.propertyType.toUpperCase() === filters.propertyType;
      const matchesPrice = (!filters.minPrice || property.price >= filters.minPrice) &&
        (!filters.maxPrice || property.price <= filters.maxPrice);
      const matchesBedrooms = !filters.bedrooms || property.bedrooms >= filters.bedrooms;
      const matchesBathrooms = !filters.bathrooms || property.bathrooms >= filters.bathrooms;

      return matchesSearch && matchesType && matchesPrice && matchesBedrooms && matchesBathrooms;
    });
  }, [properties, debouncedSearchQuery, filters]);

  if (error) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Filters Section */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Filters</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Property Type</label>
              <select
                value={filters.propertyType}
                onChange={(e) => setFilters({ ...filters, propertyType: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="">All Types</option>
                <option value="HOUSE">House</option>
                <option value="APARTMENT">Apartment</option>
                <option value="VILLA">Villa</option>
                <option value="CABIN">Cabin</option>
              </select>
            </div>
            
            <div>
              <label className="mb-2 block text-sm font-medium">Price Range</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice || ""}
                  onChange={(e) => setFilters({ ...filters, minPrice: Number(e.target.value) })}
                  className="w-24 rounded-md border border-gray-300 px-3 py-2"
                />
                <span>-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice || ""}
                  onChange={(e) => setFilters({ ...filters, maxPrice: Number(e.target.value) })}
                  className="w-24 rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Min Bedrooms</label>
              <select
                value={filters.bedrooms?.toString()}
                onChange={(e) => setFilters({ ...filters, bedrooms: Number(e.target.value) })}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="">Any</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Min Bathrooms</label>
              <select
                value={filters.bathrooms?.toString()}
                onChange={(e) => setFilters({ ...filters, bathrooms: Number(e.target.value) })}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="">Any</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
              </select>
            </div>
          </div>
        </div>

        {/* Search Results */}
        {isLoading ? (
          <div className="flex h-96 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {filteredProperties.length} Properties Found
              </h2>
              <div className="relative">
                <input
                  type="search"
                  placeholder="Search properties..."
                  value={localSearchQuery}
                  onChange={(e) => {
                    setLocalSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  className="max-w-xs rounded-md border border-gray-300 px-3 py-2"
                />
                {showSuggestions && searchSuggestions.length > 0 && (
                  <div 
                    className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {searchSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="cursor-pointer px-4 py-2 hover:bg-gray-100"
                        onClick={() => {
                          setLocalSearchQuery(suggestion);
                          setShowSuggestions(false);
                        }}
                      >
                        {suggestion}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProperties.map((property) => (
                <div
                  key={property.id}
                  onClick={() => navigate(`/properties/${property.id}`)}
                  className="cursor-pointer overflow-hidden rounded-lg bg-white shadow-sm transition-transform hover:scale-[1.02]"
                >
                  <img
                    src={property.images[0] || 'https://via.placeholder.com/300x200'}
                    alt={property.title}
                    className="h-48 w-full object-cover"
                  />
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900">{property.title}</h3>
                    <p className="mt-1 flex items-center text-sm text-gray-500">
                      <MapPin className="mr-1 h-4 w-4" />
                      {property.location.address}
                    </p>
                    <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <Bed className="mr-1 h-4 w-4" />
                        {property.bedrooms} beds
                      </span>
                      <span className="flex items-center">
                        <Bath className="mr-1 h-4 w-4" />
                        {property.bathrooms} baths
                      </span>
                      <span className="flex items-center">
                        <Users className="mr-1 h-4 w-4" />
                        {property.maxGuests} guests
                      </span>
                    </div>
                    <p className="mt-4 text-lg font-bold text-blue-600">
                      {formatPrice(property.price)} <span className="text-sm font-normal">per night</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {filteredProperties.length === 0 && (
              <div className="flex h-96 items-center justify-center">
                <p className="text-gray-500">No properties found matching your criteria</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
