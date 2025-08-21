import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserPreferences {
  propertyTypes: string[];
  preferredLocations: string[];
  priceRange: { min: number; max: number };
}

interface PreferencesState {
  preferences: UserPreferences;
  setPreferences: (preferences: UserPreferences) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      preferences: {
        propertyTypes: [],
        preferredLocations: [],
        priceRange: { min: 0, max: 0 },
      },
      setPreferences: (preferences) => set({ preferences }),
    }),
    {
      name: 'preferences-storage',
    }
  )
);
