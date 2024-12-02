import { useQuery, useQueryClient } from '@tanstack/react-query';

const CACHE_TIME = 1000 * 60 * 5; // 5 minutes
const STALE_TIME = 1000 * 60 * 2; // 2 minutes

export function usePropertyData(propertyId: string) {
  return useQuery({
    queryKey: ['property', propertyId],
    queryFn: async () => {
      // Fetch property data
      return {};
    },
    staleTime: STALE_TIME,
    cacheTime: CACHE_TIME,
    retry: 2,
  });
}

export function useAttractionData(location: { lat: number; lng: number }) {
  return useQuery({
    queryKey: ['attractions', location],
    queryFn: async () => {
      // Fetch nearby attractions
      return [];
    },
    staleTime: STALE_TIME,
    cacheTime: CACHE_TIME,
    retry: 2,
  });
}

export function invalidatePropertyCache(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['property'] });
}

export function prefetchPropertyData(queryClient: ReturnType<typeof useQueryClient>, propertyId: string) {
  return queryClient.prefetchQuery({
    queryKey: ['property', propertyId],
    queryFn: async () => {
      // Fetch property data
      return {};
    },
  });
}