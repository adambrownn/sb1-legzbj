import { useState, useCallback } from 'react';
import { CalendarSyncService } from '../lib/services/calendar-sync.service';
import { Property } from '../types/property';

export function useCalendarSync(property: Property) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentLockId, setCurrentLockId] = useState<string | null>(null);

  const syncCalendar = useCallback(async () => {
    setIsSyncing(true);
    setError(null);
    try {
      await CalendarSyncService.getInstance().syncCalendar(property);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync calendar');
    } finally {
      setIsSyncing(false);
    }
  }, [property]);

  const lockSlot = useCallback(async (checkIn: Date, checkOut: Date) => {
    try {
      // Release any existing lock
      if (currentLockId) {
        CalendarSyncService.getInstance().releaseLock(currentLockId);
      }

      const lockId = await CalendarSyncService.getInstance().lockSlot(
        property.id,
        checkIn,
        checkOut
      );

      setCurrentLockId(lockId);
      return lockId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to lock slot');
      return null;
    }
  }, [property.id, currentLockId]);

  const releaseLock = useCallback(() => {
    if (currentLockId) {
      CalendarSyncService.getInstance().releaseLock(currentLockId);
      setCurrentLockId(null);
    }
  }, [currentLockId]);

  return {
    isSyncing,
    error,
    currentLockId,
    syncCalendar,
    lockSlot,
    releaseLock
  };
}
