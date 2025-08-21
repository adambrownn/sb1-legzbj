import { useState, useCallback } from 'react';
import { AvailabilityService, AvailabilitySlot, AvailabilityRequest } from '../lib/services/availability.service';

export function useAvailability(propertyId: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);

  const checkAvailability = useCallback(
    async (date: string, timeRange?: { start: string; end: string }, timezone?: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const request: AvailabilityRequest = {
          propertyId,
          date,
          timeRange,
          timezone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
        };

        const availabilitySlots = await AvailabilityService.getInstance().checkAvailability(request);
        setSlots(availabilitySlots);
        return availabilitySlots;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to check availability';
        setError(errorMessage);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [propertyId]
  );

  return {
    isLoading,
    error,
    slots,
    checkAvailability
  };
}
