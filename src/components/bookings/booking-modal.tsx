import React from 'react';
import { format } from 'date-fns';
import { Calendar, Users, CreditCard } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from './date-range-picker';
import { GuestDetailsForm } from './guest-details-form';
import { PaymentForm } from './payment-form';
import { BookingSummary } from './booking-summary';
import type { Property } from '@/lib/types/property';
import type { BookingDetails } from '@/lib/types/booking';

interface BookingModalProps {
  property: Property;
  isOpen: boolean;
  onClose: () => void;
  onBookingComplete: (booking: BookingDetails) => void;
}

type BookingStep = 'dates' | 'details' | 'payment' | 'confirmation';

export function BookingModal({
  property,
  isOpen,
  onClose,
  onBookingComplete,
}: BookingModalProps) {
  const [currentStep, setCurrentStep] = React.useState<BookingStep>('dates');
  const [bookingData, setBookingData] = React.useState<Partial<BookingDetails>>({});

  const steps = [
    { id: 'dates', label: 'Select Dates', icon: Calendar },
    { id: 'details', label: 'Guest Details', icon: Users },
    { id: 'payment', label: 'Payment', icon: CreditCard },
  ];

  const handleDateSelection = (dates: { checkIn: Date; checkOut: Date }) => {
    setBookingData((prev) => ({
      ...prev,
      checkIn: dates.checkIn,
      checkOut: dates.checkOut,
    }));
    setCurrentStep('details');
  };

  const handleGuestDetails = (details: {
    name: string;
    email: string;
    phone: string;
    guests: number;
  }) => {
    setBookingData((prev) => ({
      ...prev,
      ...details,
    }));
    setCurrentStep('payment');
  };

  const handlePayment = async (paymentDetails: any) => {
    try {
      // In a real app, this would make an API call to process payment
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const booking: BookingDetails = {
        ...bookingData as BookingDetails,
        id: crypto.randomUUID(),
        propertyId: property.id,
        status: 'confirmed',
        totalAmount: calculateTotal(),
        createdAt: new Date().toISOString(),
      };

      onBookingComplete(booking);
      setCurrentStep('confirmation');
    } catch (error) {
      console.error('Payment failed:', error);
    }
  };

  const calculateTotal = () => {
    if (!bookingData.checkIn || !bookingData.checkOut) return 0;
    const nights = Math.ceil(
      (bookingData.checkOut.getTime() - bookingData.checkIn.getTime()) /
        (1000 * 60 * 60 * 24)
    );
    return property.price * nights;
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'dates':
        return (
          <DateRangePicker
            property={property}
            onSelect={handleDateSelection}
          />
        );
      case 'details':
        return (
          <GuestDetailsForm
            maxGuests={property.maxGuests}
            onSubmit={handleGuestDetails}
          />
        );
      case 'payment':
        return (
          <PaymentForm
            amount={calculateTotal()}
            onSubmit={handlePayment}
          />
        );
      case 'confirmation':
        return (
          <BookingSummary
            booking={bookingData as BookingDetails}
            property={property}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      title={
        currentStep === 'confirmation'
          ? 'Booking Confirmed!'
          : `Step ${steps.findIndex((s) => s.id === currentStep) + 1}: ${
              steps.find((s) => s.id === currentStep)?.label
            }`
      }
    >
      <div className="mt-4">
        {currentStep !== 'confirmation' && (
          <div className="mb-6 flex items-center justify-center">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted =
                steps.findIndex((s) => s.id === currentStep) >
                steps.findIndex((s) => s.id === step.id);

              return (
                <React.Fragment key={step.id}>
                  {index > 0 && (
                    <div
                      className={`h-1 w-16 ${
                        isCompleted ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      isActive || isCompleted
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        )}

        {renderStepContent()}

        {currentStep === 'confirmation' && (
          <Button
            onClick={onClose}
            className="mt-6 w-full"
          >
            Close
          </Button>
        )}
      </div>
    </Dialog>
  );
}