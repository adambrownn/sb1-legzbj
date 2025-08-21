import type { Booking } from '../../types/booking';

export interface BookingModification {
  checkIn?: string;
  checkOut?: string;
  guestCount?: number;
}

export interface INotificationService {
  sendBookingModificationNotification(params: { 
    booking: Booking; 
    modifications: BookingModification;
  }): Promise<void>;
  
  sendBookingCancellationNotification(params: { 
    booking: Booking; 
    refundAmount: number;
  }): Promise<void>;
}
