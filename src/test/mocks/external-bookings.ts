import { addDays, format } from 'date-fns';

// Use current time as base for all dates
const NOW = new Date('2024-12-14T12:34:11+05:30');

// Mock Airbnb booking format
export interface AirbnbBooking {
  reservation_id: string;
  listing_id: string;
  check_in: string;
  check_out: string;
  guest_count: number;
  status: 'confirmed' | 'pending' | 'cancelled';
  guest_details: {
    name: string;
    email: string;
  };
}

// Mock Booking.com format
export interface BookingComReservation {
  id: string;
  property_id: string;
  arrival_date: string;
  departure_date: string;
  number_of_guests: number;
  reservation_status: 'active' | 'pending' | 'cancelled';
  guest: {
    full_name: string;
    email: string;
  };
}

// Generate mock Airbnb bookings with future dates
export const mockAirbnbBookings: AirbnbBooking[] = [
  {
    reservation_id: 'airbnb_1',
    listing_id: 'property-123',
    check_in: format(addDays(NOW, 2), 'yyyy-MM-dd'),  // 2 days from now
    check_out: format(addDays(NOW, 4), 'yyyy-MM-dd'), // 4 days from now
    guest_count: 2,
    status: 'confirmed',
    guest_details: {
      name: 'John Doe',
      email: 'john@example.com',
    },
  },
  {
    reservation_id: 'airbnb_2',
    listing_id: 'property-123',
    check_in: format(addDays(NOW, 7), 'yyyy-MM-dd'),  // 7 days from now
    check_out: format(addDays(NOW, 9), 'yyyy-MM-dd'), // 9 days from now
    guest_count: 3,
    status: 'confirmed',
    guest_details: {
      name: 'Jane Smith',
      email: 'jane@example.com',
    },
  },
];

// Generate mock Booking.com reservations with future dates
export const mockBookingComReservations: BookingComReservation[] = [
  {
    id: 'booking_1',
    property_id: 'property-123',
    arrival_date: format(addDays(NOW, 12), 'yyyy-MM-dd'),   // 12 days from now
    departure_date: format(addDays(NOW, 14), 'yyyy-MM-dd'), // 14 days from now
    number_of_guests: 2,
    reservation_status: 'active',
    guest: {
      full_name: 'Alice Johnson',
      email: 'alice@example.com',
    },
  },
  {
    id: 'booking_2',
    property_id: 'property-123',
    arrival_date: format(addDays(NOW, 17), 'yyyy-MM-dd'),   // 17 days from now
    departure_date: format(addDays(NOW, 19), 'yyyy-MM-dd'), // 19 days from now
    number_of_guests: 4,
    reservation_status: 'active',
    guest: {
      full_name: 'Bob Wilson',
      email: 'bob@example.com',
    },
  },
];

// Mock webhook payloads with future dates
export const mockWebhookPayloads = [
  {
    source: 'airbnb',
    type: 'reservation.created',
    payload: {
      reservation_id: 'airbnb_new',
      listing_id: 'property-123',
      check_in: format(addDays(NOW, 22), 'yyyy-MM-dd'),   // 22 days from now
      check_out: format(addDays(NOW, 24), 'yyyy-MM-dd'),  // 24 days from now
      guest_count: 2,
      status: 'confirmed',
      guest_details: {
        name: 'New Guest',
        email: 'newguest@example.com',
      },
    },
  },
  {
    source: 'booking.com',
    type: 'reservation.cancelled',
    payload: {
      id: 'booking_cancel',
      property_id: 'property-123',
      arrival_date: format(addDays(NOW, 27), 'yyyy-MM-dd'),   // 27 days from now
      departure_date: format(addDays(NOW, 29), 'yyyy-MM-dd'), // 29 days from now
      number_of_guests: 2,
      reservation_status: 'cancelled',
      guest: {
        full_name: 'Cancel Guest',
        email: 'cancel@example.com',
      },
    },
  },
];
