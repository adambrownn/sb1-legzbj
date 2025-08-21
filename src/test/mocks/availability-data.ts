import { addDays, addHours, format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import type { Booking } from '../../lib/types/booking';

const NOW = new Date('2024-12-16T12:00:00+05:30');
const TOMORROW = addDays(NOW, 1);
const DAY_AFTER = addDays(NOW, 2);
const THREE_DAYS_LATER = addDays(NOW, 3);
const FOUR_DAYS_LATER = addDays(NOW, 4);
const YESTERDAY = addDays(NOW, -1);

type BookingInput = Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>;

export const testTimezones = [
  {
    timezone: 'Asia/Kolkata',
    checkIn: format(addHours(TOMORROW, 12), "yyyy-MM-dd'T'HH:mm:ssXXX"),
    checkOut: format(addHours(DAY_AFTER, 12), "yyyy-MM-dd'T'HH:mm:ssXXX"),
  },
];

export const mockBookings: BookingInput[] = [
  {
    propertyId: 'property-123',
    userId: 'user-123',
    checkIn: format(addHours(TOMORROW, 12), "yyyy-MM-dd'T'HH:mm:ssXXX"), // 2024-12-18T12:00:00+05:30
    checkOut: format(addHours(DAY_AFTER, 12), "yyyy-MM-dd'T'HH:mm:ssXXX"), // 2024-12-19T12:00:00+05:30
    timezone: 'Asia/Kolkata',
    status: 'confirmed',
  },
];
