// import { AvailabilityService } from '../availability.service';
// import { CacheService } from '../cache.service';
// import { BookingStore } from '../../store/booking-store';
// import { mockBookings, testTimezones } from './mocks/availability-data';
// import { addDays, addHours, format } from 'date-fns';

// describe('AvailabilityService', () => {
//   let availabilityService: AvailabilityService;
//   let cacheService: jest.Mocked<CacheService>;
//   let bookingStore: jest.Mocked<BookingStore>;

//   const NOW = new Date('2024-12-16T12:00:00+05:30');
//   const TOMORROW = addDays(NOW, 1);
//   const DAY_AFTER = addDays(NOW, 2);
//   const THREE_DAYS_LATER = addDays(NOW, 3);
//   const FOUR_DAYS_LATER = addDays(NOW, 4);

//   beforeEach(() => {
//     // Mock CacheService
//     cacheService = {
//       get: jest.fn(),
//       set: jest.fn(),
//       clear: jest.fn(),
//       delete: jest.fn(),
//       has: jest.fn()
//     } as jest.Mocked<CacheService>;

//     // Mock BookingStore
//     bookingStore = {
//       clear: jest.fn(),
//       addBooking: jest.fn(),
//       getBookings: jest.fn().mockReturnValue(mockBookings),
//       updateBooking: jest.fn(),
//       removeBooking: jest.fn(),
//       getBookingById: jest.fn()
//     } as jest.Mocked<BookingStore>;

//     availabilityService = new AvailabilityService(cacheService, bookingStore);
    
//     // Initialize mock data
//     bookingStore.clear();
//     cacheService.clear();
//     mockBookings.forEach((booking) => bookingStore.addBooking(booking));

//     // Set up cache mock behavior
//     cacheService.get.mockImplementation((key: string) => null);
//     cacheService.has.mockImplementation((key: string) => false);
//   });

//   it('should return true for available dates with no overlapping bookings', async () => {
//     const result = await availabilityService.isAvailable(
//       'property-123',
//       '2024-12-21T12:00:00+05:30',
//       '2024-12-22T12:00:00+05:30',
//       'Asia/Kolkata'
//     );
//     expect(result).toBe(true);
//   });

//   it('should return false for overlapping bookings in Asia/Kolkata timezone', async () => {
//     const result = await availabilityService.isAvailable(
//       'property-123',
//       '2024-12-18T12:00:00+05:30',
//       '2024-12-19T12:00:00+05:30',
//       'Asia/Kolkata'
//     );
//     expect(result).toBe(false);
//   });

//   it('should return false for overlapping bookings in UTC timezone', async () => {
//     const result = await availabilityService.isAvailable(
//       'property-123',
//       '2024-12-18T09:00:00Z',
//       '2024-12-18T21:00:00Z',
//       'UTC'
//     );
//     expect(result).toBe(false);
//   });

//   it('should return true for non-overlapping bookings in UTC timezone', async () => {
//     const result = await availabilityService.isAvailable(
//       'property-123',
//       '2024-12-21T09:00:00Z',
//       '2024-12-22T09:00:00Z',
//       'UTC'
//     );
//     expect(result).toBe(true);
//   });

//   it('should return false for check-in time in the past', async () => {
//     const result = await availabilityService.isAvailable(
//       'property-123',
//       '2024-12-15T12:00:00+05:30', // Past date
//       '2024-12-16T12:00:00+05:30',
//       'Asia/Kolkata'
//     );
//     expect(result).toBe(false);
//   });

//   it('should ignore cancelled bookings when checking availability', async () => {
//     const cancelledBooking = {
//       id: 'booking-cancelled',
//       propertyId: 'property-123',
//       userId: 'user-cancelled',
//       checkIn: format(addHours(THREE_DAYS_LATER, 12), "yyyy-MM-dd'T'HH:mm:ssXXX"),
//       checkOut: format(addHours(FOUR_DAYS_LATER, 12), "yyyy-MM-dd'T'HH:mm:ssXXX"),
//       timezone: 'Asia/Kolkata',
//       status: 'cancelled'
//     };
    
//     bookingStore.addBooking(cancelledBooking);

//     const result = await availabilityService.isAvailable(
//       'property-123',
//       '2024-12-20T12:00:00+05:30',
//       '2024-12-21T12:00:00+05:30',
//       'Asia/Kolkata'
//     );
//     expect(result).toBe(true);
//   });

//   it('should handle edge cases where check-in equals another booking's check-out', async () => {
//     const result = await availabilityService.isAvailable(
//       'property-123',
//       '2024-12-20T12:00:00+05:30', // Equals an existing check-out
//       '2024-12-21T12:00:00+05:30',
//       'Asia/Kolkata'
//     );
//     expect(result).toBe(true);
//   });

//   it('should handle edge cases where check-out equals another booking's check-in', async () => {
//     const result = await availabilityService.isAvailable(
//       'property-123',
//       '2024-12-18T12:00:00+05:30', // Equals an existing check-in
//       '2024-12-18T12:00:00+05:30',
//       'Asia/Kolkata'
//     );
//     expect(result).toBe(false);
//   });

//   it('should validate availability when multiple bookings exist', async () => {
//     const result = await availabilityService.isAvailable(
//       'property-123',
//       '2024-12-22T12:00:00+05:30',
//       '2024-12-23T12:00:00+05:30',
//       'Asia/Kolkata'
//     );
//     expect(result).toBe(true);
//   });

//   it('should handle exact interval match as an overlap', async () => {
//     const existingBooking = mockBookings[0];
//     const result = await availabilityService.isAvailable(
//       'property-123',
//       existingBooking.checkIn,
//       existingBooking.checkOut,
//       existingBooking.timezone
//     );
//     expect(result).toBe(false);
//   });
// });