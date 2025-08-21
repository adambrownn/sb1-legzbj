export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type CancellationPolicy = 'flexible' | 'moderate' | 'strict';

export interface Booking {
  id: string;
  propertyId: string;
  userId: string;
  checkIn: string;  // ISO string
  checkOut: string; // ISO string
  guests: number;
  name: string;
  email: string;
  phone: string;
  totalAmount: number;
  status: BookingStatus;
  cancellationPolicy: CancellationPolicy;
  cancellationReason?: string;
  createdAt: string;  // ISO string
  updatedAt: string;  // ISO string
  timezone: string;
}

export interface BookingModification {
  checkIn?: string;
  checkOut?: string;
  guestCount?: number;
}