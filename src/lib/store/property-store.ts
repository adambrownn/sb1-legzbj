import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getFeaturedProperties } from '@/lib/api/properties';
import type { Property } from '@/lib/types/property';

interface PropertyState {
  properties: Property[];
  isLoading: boolean;
  error: string | null;
  loadProperties: () => Promise<void>;
  addProperty: (property: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProperty: (id: string, property: Partial<Property>) => void;
  deleteProperty: (id: string) => void;
  getHostProperties: (hostId: string) => Property[];
}

export const usePropertyStore = create<PropertyState>()(
  persist(
    (set, get) => ({
      properties: [],
      isLoading: false,
      error: null,
      loadProperties: async () => {
        set({ isLoading: true, error: null });
        try {
          const properties = await getFeaturedProperties();
          set({ properties, isLoading: false });
        } catch (error) {
          set({ error: 'Failed to load properties', isLoading: false });
        }
      },
      addProperty: (property) => {
        const newProperty = {
          ...property,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({
          properties: [...state.properties, newProperty],
        }));
      },
      updateProperty: (id, updates) => {
        set((state) => ({
          properties: state.properties.map((property) =>
            property.id === id
              ? { ...property, ...updates, updatedAt: new Date().toISOString() }
              : property
          ),
        }));
      },
      deleteProperty: (id) => {
        set((state) => ({
          properties: state.properties.filter((property) => property.id !== id),
        }));
      },
      getHostProperties: (hostId) => {
        return get().properties.filter((property) => property.hostId === hostId);
      },
    }),
    {
      name: 'property-storage',
    }
  )
);