export interface BookingDetails {
  id: string;
  propertyId: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  name: string;
  email: string;
  phone: string;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
}