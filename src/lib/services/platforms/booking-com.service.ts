import { createLogger } from '../../logger';
import { delay } from '../../utils/time';

interface AvailabilityUpdate {
  startDate: string;
  endDate: string;
  isAvailable: boolean;
}

export class BookingComService {
  private logger = createLogger('booking-com-service');
  private mockData = new Map<string, Map<string, boolean>>();
  private apiError = false;

  async updateAvailability(
    propertyId: string,
    startDate: string,
    endDate: string,
    isAvailable: boolean
  ): Promise<void> {
    this.logger.debug('Updating availability', {
      propertyId,
      startDate,
      endDate,
      isAvailable
    });

    if (this.apiError) {
      throw new Error('API error occurred');
    }

    if (!this.mockData.has(propertyId)) {
      this.mockData.set(propertyId, new Map());
    }

    const propertyData = this.mockData.get(propertyId)!;
    propertyData.set(`${startDate}-${endDate}`, isAvailable);

    // Simulate API delay
    await delay(150); // Booking.com API is slightly slower
  }

  async checkAvailability(
    propertyId: string,
    startDate: string,
    endDate: string
  ): Promise<{ isAvailable: boolean }> {
    this.logger.debug('Checking availability', {
      propertyId,
      startDate,
      endDate
    });

    if (this.apiError) {
      throw new Error('API error occurred');
    }

    if (!propertyId.startsWith('test-property')) {
      throw new Error('Invalid property ID');
    }

    const propertyData = this.mockData.get(propertyId);
    if (!propertyData) {
      return { isAvailable: true }; // Default to available
    }

    const availability = propertyData.get(`${startDate}-${endDate}`);
    return { isAvailable: availability ?? true };
  }

  async getSyncStatus(propertyId: string): Promise<{ success: boolean }> {
    this.logger.debug('Getting sync status', { propertyId });

    if (this.apiError) {
      throw new Error('API error occurred');
    }

    // For testing, consider sync successful if property exists in mock data
    return { success: this.mockData.has(propertyId) };
  }

  async bulkUpdateAvailability(
    propertyId: string,
    updates: AvailabilityUpdate[]
  ): Promise<void> {
    this.logger.debug('Performing bulk update', {
      propertyId,
      updateCount: updates.length
    });

    if (this.apiError) {
      throw new Error('API error occurred');
    }

    for (const update of updates) {
      await this.updateAvailability(
        propertyId,
        update.startDate,
        update.endDate,
        update.isAvailable
      );
    }
  }

  async simulateAPIError(): Promise<void> {
    this.apiError = true;
    await delay(100); // Simulate delay
  }
}
