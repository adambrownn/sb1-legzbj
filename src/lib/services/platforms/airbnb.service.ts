import { createLogger } from '../../logger';
import { delay } from '../../utils/time';

export class AirbnbService {
  private logger = createLogger('airbnb-service');
  private mockData = new Map<string, Map<string, boolean>>();
  private networkError = false;

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

    if (this.networkError) {
      throw new Error('Network error occurred');
    }

    if (!this.mockData.has(propertyId)) {
      this.mockData.set(propertyId, new Map());
    }

    const propertyData = this.mockData.get(propertyId)!;
    propertyData.set(`${startDate}-${endDate}`, isAvailable);

    // Simulate API delay
    await delay(100);
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

    if (this.networkError) {
      throw new Error('Network error occurred');
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

    if (this.networkError) {
      throw new Error('Network error occurred');
    }

    // For testing, consider sync successful if property exists in mock data
    return { success: this.mockData.has(propertyId) };
  }

  async simulateNetworkError(): Promise<void> {
    this.networkError = true;
    await delay(100); // Simulate delay
  }
}
