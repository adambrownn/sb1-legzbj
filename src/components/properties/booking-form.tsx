import React, { useState, useEffect } from 'react';
import { DateRange } from 'react-day-picker';
import { differenceInDays, addDays } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import type { Property } from '@/types/property';
import { PricingBreakdown } from './pricing-breakdown';

interface BookingFormProps {
  property: Property;
  className?: string;
}

export function BookingForm({ property, className }: BookingFormProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [guests, setGuests] = useState(1);
  const [nights, setNights] = useState(0);
  const [isEarlyBird, setIsEarlyBird] = useState(false);
  const [isLongStay, setIsLongStay] = useState(false);

  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      const nightsCount = differenceInDays(dateRange.to, dateRange.from);
      setNights(nightsCount);

      // Check for early bird discount
      if (property.pricing.earlyBirdDiscount) {
        const daysUntilCheckIn = differenceInDays(dateRange.from, new Date());
        setIsEarlyBird(daysUntilCheckIn >= property.pricing.earlyBirdDiscount.daysInAdvance);
      }

      // Check for long stay discount
      if (property.pricing.longStayThreshold) {
        setIsLongStay(nightsCount >= property.pricing.longStayThreshold);
      }
    }
  }, [dateRange, property.pricing]);

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement booking submission
    console.log('Booking submitted:', {
      checkIn: dateRange?.from,
      checkOut: dateRange?.to,
      guests,
      nights,
      isEarlyBird,
      isLongStay
    });
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Select Dates</h3>
          <Calendar
            mode="range"
            onDateChange={(range: any) => handleDateRangeChange(range)}
            availability={property.availability}
            pricing={property.pricing}
            numberOfMonths={2}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Number of Guests
          </label>
          <select
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
          >
            {Array.from({ length: property.maxGuests }, (_, i) => i + 1).map((num) => (
              <option key={num} value={num}>
                {num} guest{num !== 1 ? 's' : ''}
              </option>
            ))}
          </select>
        </div>

        {dateRange?.from && dateRange?.to && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <PricingBreakdown
              pricing={property.pricing}
              nights={nights}
              guests={guests}
              isEarlyBird={isEarlyBird}
              isLongStay={isLongStay}
            />
          </div>
        )}

        <button
          type="submit"
          disabled={!dateRange?.from || !dateRange?.to}
          className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Book Now
        </button>

        {isEarlyBird && (
          <p className="text-sm text-green-600">
            🎉 Early bird discount applied! Book now and save {property.pricing.earlyBirdDiscount?.percentage}%
          </p>
        )}
        
        {isLongStay && (
          <p className="text-sm text-green-600">
            🎉 Long stay discount applied! Save {property.pricing.longStayDiscountPercentage}% on your extended stay
          </p>
        )}
      </div>
    </form>
  );
}