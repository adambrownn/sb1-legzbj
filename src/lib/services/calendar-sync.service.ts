import { format, parseISO } from 'date-fns';
import { nanoid } from 'nanoid';
import { bookingStoreApi } from '../store/booking-store';
import { Property } from '../types/property';
import { mockBookingAPIs } from '../../test/mocks/booking-apis.mock';
import { createLogger } from '../logger';
import { pino } from 'pino';
import { TestExecutionState, getConfig, getCurrentTestId } from '../../test/test-context';

// Create a namespaced logger for this service
const logger = createLogger('calendar-sync');

export interface ExternalBooking {
  id: string;
  propertyId: string;
  checkIn: string;
  checkOut: string;
  guestCount: number;
  source: 'airbnb' | 'booking.com' | 'direct';
  externalId: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}

interface BookingLock {
  id: string;
  propertyId: string;
  checkIn: string;
  checkOut: string;
  expiry: Date;
  priority: number;
  createdAt: Date;
}

interface TestConfig {
  logging: {
    level: string;
    includeTimestamps: boolean;
  };
  timeouts: {
    lockRetry: number;
  };
  retries: {
    maxLockAttempts: number;
    backoffMultiplier: number;
    minBackoffDelay: number;
    maxBackoffDelay: number;
  };
}

interface LockAcquisitionResult {
  success: boolean;
  lockId?: string;
  error?: string;
  retryCount?: number;
}

interface LockOptions {
  propertyId: string;
  checkIn: string;
  checkOut: string;
  priority?: number;
  maxAttempts?: number;
  timeout?: number;
}

export class CalendarSyncService {
  private static instance: CalendarSyncService;
  private readonly bookingLocks: Map<string, BookingLock> = new Map();
  private readonly logger: pino.Logger;
  private readonly config: TestConfig;

  private constructor() {
    this.config = getConfig();
    this.logger = pino({
      name: 'calendar-sync',
      level: this.config.logging.level,
      timestamp: this.config.logging.includeTimestamps,
      base: {
        testId: () => getCurrentTestId()
      }
    });
    this.setupWebhooks();
    logger.info('CalendarSyncService initialized');
    logger.info('Initial store state:', bookingStoreApi.getState());
  }

  public static getInstance(): CalendarSyncService {
    if (!CalendarSyncService.instance) {
      CalendarSyncService.instance = new CalendarSyncService();
    }
    return CalendarSyncService.instance;
  }

  public async clearAllLocks(): Promise<void> {
    const lockCount = this.bookingLocks.size;
    this.bookingLocks.clear();
    logger.info(`Cleared ${lockCount} locks`);
  }

  private setupWebhooks() {
    logger.info('Setting up webhooks');
    // TODO: Setup webhook listeners for external booking platforms
    // This would be implemented when integrating with actual external APIs
  }

  public async getBookings(propertyId: string): Promise<ExternalBooking[]> {
    const state = bookingStoreApi.getState();
    return state.externalBookings[propertyId] || [];
  }

  public async syncCalendar(property: Property): Promise<void> {
    logger.info(`Syncing calendar for property ${property.id}`);
    try {
      const [airbnbBookings, bookingComBookings] = await Promise.all([
        mockBookingAPIs.getAirbnbBookings(property.id),
        mockBookingAPIs.getBookingComBookings(property.id),
      ]);

      logger.info('Fetched external bookings:', {
        airbnb: airbnbBookings.length,
        bookingCom: bookingComBookings.length,
        airbnbBookings: airbnbBookings.map(b => ({
          id: b.externalId,
          checkIn: b.checkIn,
          checkOut: b.checkOut,
          status: b.status
        })),
        bookingComBookings: bookingComBookings.map(b => ({
          id: b.externalId,
          checkIn: b.checkIn,
          checkOut: b.checkOut,
          status: b.status
        }))
      });

      // Merge bookings and resolve conflicts
      const mergedBookings = await this.mergeAndResolveConflicts(property.id, [
        ...airbnbBookings,
        ...bookingComBookings
      ]);

      await this.updateExternalBookings(property.id, mergedBookings);
      logger.info(`Successfully synced ${mergedBookings.length} bookings for property ${property.id}`, {
        mergedBookings: mergedBookings.map(b => ({
          id: b.externalId,
          checkIn: b.checkIn,
          checkOut: b.checkOut,
          status: b.status
        }))
      });
    } catch (error) {
      logger.error('Failed to sync calendar:', error);
      throw error;
    }
  }

  private async mergeAndResolveConflicts(propertyId: string, bookings: ExternalBooking[]): Promise<ExternalBooking[]> {
    logger.info('Starting merge and conflict resolution:', {
      propertyId,
      totalBookings: bookings.length,
      bookingsBySource: bookings.reduce((acc, b) => {
        acc[b.source] = (acc[b.source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      bookingsByStatus: bookings.reduce((acc, b) => {
        acc[b.status] = (acc[b.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    });

    // Convert all dates to UTC and normalize status
    const normalizedBookings = bookings.map(booking => ({
      ...booking,
      checkIn: new Date(booking.checkIn).toISOString(),
      checkOut: new Date(booking.checkOut).toISOString(),
      // Normalize 'active' to 'confirmed' status
      status: booking.status === 'active' ? 'confirmed' : booking.status
    }));

    // Sort bookings by priority rules
    const sortedBookings = [...normalizedBookings].sort((a, b) => {
      // Rule 1: Status Priority (confirmed > pending > cancelled)
      const statusPriority = { confirmed: 0, pending: 1, cancelled: 2 };
      const statusCompare = statusPriority[a.status] - statusPriority[b.status];
      if (statusCompare !== 0) return statusCompare;

      // Rule 2: Source Priority (direct > airbnb > booking.com)
      const sourcePriority = { direct: 0, airbnb: 1, 'booking.com': 2 };
      const sourceCompare = sourcePriority[a.source] - sourcePriority[b.source];
      if (sourceCompare !== 0) return sourceCompare;

      // Rule 3: Earlier check-in date wins
      return new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime();
    });

    logger.debug('Sorted bookings:', sortedBookings.map(b => ({
      id: b.externalId,
      source: b.source,
      status: b.status,
      checkIn: b.checkIn,
      checkOut: b.checkOut
    })));

    const mergedBookings: ExternalBooking[] = [];
    const processedBookings = new Set<string>();

    // Process each booking in priority order
    for (const booking of sortedBookings) {
      // Skip if already processed or cancelled
      if (processedBookings.has(booking.externalId) || booking.status === 'cancelled') {
        continue;
      }

      // Find overlapping bookings that haven't been processed
      const overlappingBookings = sortedBookings.filter(other => 
        !processedBookings.has(other.externalId) &&
        other.externalId !== booking.externalId &&
        other.status !== 'cancelled' &&
        this.datesOverlap(booking.checkIn, booking.checkOut, other.checkIn, other.checkOut)
      );

      // Log overlapping bookings for debugging
      if (overlappingBookings.length > 0) {
        logger.debug('Found overlapping bookings:', {
          booking: {
            id: booking.externalId,
            source: booking.source,
            status: booking.status,
            checkIn: booking.checkIn,
            checkOut: booking.checkOut
          },
          overlapping: overlappingBookings.map(b => ({
            id: b.externalId,
            source: b.source,
            status: b.status,
            checkIn: b.checkIn,
            checkOut: b.checkOut
          }))
        });
      }

      // Add the current booking since it has highest priority
      mergedBookings.push(booking);
      processedBookings.add(booking.externalId);

      // Mark overlapping bookings as processed
      overlappingBookings.forEach(b => {
        processedBookings.add(b.externalId);
      });
    }

    // Log final merged bookings
    logger.info('Merge completed:', {
      totalMerged: mergedBookings.length,
      mergedBookings: mergedBookings.map(b => ({
        id: b.externalId,
        source: b.source,
        status: b.status,
        checkIn: b.checkIn,
        checkOut: b.checkOut
      }))
    });

    return mergedBookings;
  }

  private isLockExpired(lock: BookingLock): boolean {
    return new Date() > lock.expiry;
  }

  private async cleanupExpiredLocks(): Promise<void> {
    const expiredLocks: string[] = [];
    
    for (const [lockId, lock] of this.bookingLocks.entries()) {
      if (this.isLockExpired(lock)) {
        this.bookingLocks.delete(lockId);
        expiredLocks.push(lockId);
      }
    }
    
    if (expiredLocks.length > 0) {
      this.logger.info(`Cleaned up ${expiredLocks.length} expired locks:`, expiredLocks);
    }
  }

  public async acquireLock(options: LockOptions): Promise<LockAcquisitionResult> {
    const {
      propertyId,
      checkIn,
      checkOut,
      priority = 0,
      maxAttempts = this.config.retries.maxLockAttempts,
      timeout = this.config.timeouts.lockRetry
    } = options;

    let attempt = 0;
    const startTime = Date.now();

    while (attempt < maxAttempts) {
      attempt++;
      
      try {
        // Cleanup expired locks first
        await this.cleanupExpiredLocks();

        // Check for existing valid locks
        const existingLock = Array.from(this.bookingLocks.values()).find(
          lock => lock.propertyId === propertyId &&
                 !this.isLockExpired(lock) &&
                 this.datesOverlap(lock.checkIn, lock.checkOut, checkIn, checkOut)
        );

        if (existingLock) {
          // If existing lock has lower priority, try to override it
          if (priority > existingLock.priority) {
            this.bookingLocks.delete(existingLock.id);
            this.logger.info(`Overriding lower priority lock ${existingLock.id}`);
          } else {
            const waitTime = Math.min(
              this.config.retries.maxBackoffDelay,
              this.config.retries.minBackoffDelay * Math.pow(this.config.retries.backoffMultiplier, attempt - 1)
            );

            this.logger.debug(`Lock exists with higher/equal priority, waiting ${waitTime}ms before retry`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
        }

        // Create new lock
        const lockId = nanoid();
        const lock: BookingLock = {
          id: lockId,
          propertyId,
          checkIn,
          checkOut,
          priority,
          expiry: new Date(Date.now() + timeout),
          createdAt: new Date()
        };

        this.bookingLocks.set(lockId, lock);
        this.logger.info(`Lock ${lockId} acquired for property ${propertyId}`);

        return {
          success: true,
          lockId,
          retryCount: attempt - 1
        };
      } catch (error) {
        this.logger.error(`Error acquiring lock on attempt ${attempt}:`, error);
        
        if (attempt === maxAttempts) {
          return {
            success: false,
            error: `Failed to acquire lock after ${maxAttempts} attempts: ${error.message}`,
            retryCount: attempt
          };
        }
      }
    }

    return {
      success: false,
      error: `Failed to acquire lock after ${maxAttempts} attempts due to timeout`,
      retryCount: attempt
    };
  }

  private datesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
    const s1 = new Date(start1).getTime();
    const e1 = new Date(end1).getTime();
    const s2 = new Date(start2).getTime();
    const e2 = new Date(end2).getTime();
    return s1 < e2 && s2 < e1;
  }

  public async releaseLock(lockId: string): Promise<void> {
    if (this.bookingLocks.has(lockId)) {
      const lock = this.bookingLocks.get(lockId)!;
      this.bookingLocks.delete(lockId);
      this.logger.info(`Lock ${lockId} released for property ${lock.propertyId}`);
    } else {
      this.logger.warn(`Attempted to release non-existent lock: ${lockId}`);
    }
  }

  public async clearAllLocks(): Promise<void> {
    const lockCount = this.bookingLocks.size;
    const lockIds = Array.from(this.bookingLocks.keys());
    this.bookingLocks.clear();
    this.logger.info(`Cleared ${lockCount} locks:`, lockIds);
  }

  public async handleWebhook(source: string, event: { type: string; payload: any }): Promise<{ success: boolean; message: string; error?: string }> {
    this.logger.info('Handling webhook event:', { source, type: event.type });
    
    try {
      let booking: ExternalBooking;
      const { payload } = event;

      if (source === 'airbnb') {
        booking = {
          id: nanoid(),
          propertyId: payload.listing_id,
          checkIn: new Date(payload.check_in).toISOString(),
          checkOut: new Date(payload.check_out).toISOString(),
          guestCount: payload.guest_count,
          source: 'airbnb',
          externalId: payload.reservation_id,
          status: payload.status
        };
      } else if (source === 'booking.com') {
        booking = {
          id: nanoid(),
          propertyId: payload.property_id,
          checkIn: new Date(payload.arrival_date).toISOString(),
          checkOut: new Date(payload.departure_date).toISOString(),
          guestCount: payload.number_of_guests,
          source: 'booking.com', 
          externalId: payload.id,
          status: payload.reservation_status === 'active' ? 'confirmed' : 
                 payload.reservation_status === 'cancelled' ? 'cancelled' : 'pending'
        };
      } else {
        throw new Error(`Unsupported booking source: ${source}`);
      }

      // Validate dates
      const checkIn = new Date(booking.checkIn);
      const checkOut = new Date(booking.checkOut);
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      if (checkIn < now) {
        return {
          success: false,
          error: 'Check-in date cannot be in the past'
        };
      }

      if (checkIn >= checkOut) {
        return {
          success: false,
          error: 'Check-in date must be before check-out date'
        };
      }

      // Check for conflicts with confirmed bookings
      const existingBookings = await this.getBookings(booking.propertyId);
      const conflicts = existingBookings.filter(existing =>
        existing.id !== booking.id &&
        existing.status === 'confirmed' &&
        this.datesOverlap(booking.checkIn, booking.checkOut, existing.checkIn, existing.checkOut)
      );

      if (conflicts.length > 0 && booking.status === 'confirmed') {
        this.logger.warn('Booking conflict detected:', {
          newBooking: booking,
          conflicts
        });
        return {
          success: false,
          error: `Booking conflicts with existing confirmed bookings: ${conflicts.map(c => c.id).join(', ')}`
        };
      }

      // Update bookings store
      const updatedBookings = [...existingBookings.filter(b => b.externalId !== booking.externalId)];
      if (booking.status !== 'cancelled') {
        updatedBookings.push(booking);
      }
      
      await this.updateExternalBookings(booking.propertyId, updatedBookings);
      return { 
        success: true,
        message: booking.status === 'cancelled' ? 
          'Booking cancelled and calendar synced' : 
          'Calendar synced successfully'
      };
    } catch (error) {
      this.logger.error('Webhook handling failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  public async reset(): Promise<void> {
    try {
      this.logger.info('Resetting CalendarSyncService state');
      
      // Clear all locks
      await this.clearAllLocks();
      
      // Reset the booking store
      bookingStoreApi.setState({
        externalBookings: {},
        locks: [],
        lastSync: null
      });
      
      // Clear any webhook subscriptions
      this.setupWebhooks();
      
      // Force cleanup of expired locks
      await this.cleanupExpiredLocks();
      
      this.logger.info('CalendarSyncService state reset complete');
    } catch (error) {
      this.logger.error('Error resetting CalendarSyncService state:', error);
      throw error;
    }
  }

  private async updateExternalBookings(propertyId: string, bookings: ExternalBooking[]): Promise<void> {
    this.logger.info(`Updating external bookings for property ${propertyId}`, bookings);
    bookingStoreApi.setState((state) => ({
      ...state,
      externalBookings: {
        ...state.externalBookings,
        [propertyId]: bookings,
      },
    }));
  }
}
