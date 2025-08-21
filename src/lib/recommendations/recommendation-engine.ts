import { usePreferencesStore } from '@/lib/store/preferences-store';

interface Property {
  id: string;
  type: string;
  location: string;
  price: number;
}

export function getRecommendations(properties: Property[]): Property[] {
  const { preferences } = usePreferencesStore.getState();

  return properties.filter((property) => {
    const matchesType = preferences.propertyTypes.includes(property.type);
    const matchesLocation = preferences.preferredLocations.includes(property.location);
    const matchesPrice =
      property.price >= preferences.priceRange.min &&
      property.price <= preferences.priceRange.max;

    return matchesType && matchesLocation && matchesPrice;
  });
}
