import React from 'react';
import { DayPicker } from 'react-day-picker';
import { cn } from '@/lib/utils';
import type { PropertyAvailability, PropertyPricing } from '@/types/property';

interface CalendarProps {
  className?: string;
  onDateChange?: (date: Date | undefined) => void;
  initialDate?: Date;
  availability?: PropertyAvailability[];
  pricing?: PropertyPricing;
  numberOfMonths?: number;
  mode?: 'single' | 'range';
}

export function Calendar({ 
  className, 
  onDateChange, 
  initialDate = new Date(),
  availability = [],
  pricing,
  numberOfMonths = 2,
  mode = 'single'
}: CalendarProps) {
  const disabledDays = availability
    .filter(day => day.status === 'booked' || day.status === 'maintenance')
    .map(day => new Date(day.date));

  const getDayPrice = (date: Date) => {
    const availabilityInfo = availability.find(
      day => new Date(day.date).toDateString() === date.toDateString()
    );
    if (!availabilityInfo) return pricing?.baseRate;

    let price = availabilityInfo.price;

    // Apply seasonal adjustments if any
    if (pricing?.seasonalRates) {
      const applicableSeason = pricing.seasonalRates.find(season => {
        const startDate = new Date(season.startDate);
        const endDate = new Date(season.endDate);
        return date >= startDate && date <= endDate;
      });

      if (applicableSeason) {
        price *= (1 + applicableSeason.adjustmentPercentage / 100);
      }
    }

    return price;
  };

  const renderDay = (date: Date) => {
    const price = getDayPrice(date);
    const isAvailable = !disabledDays.some(
      disabledDate => disabledDate.toDateString() === date.toDateString()
    );

    return (
      <div className="relative p-2">
        <div>{date.getDate()}</div>
        {isAvailable && price && (
          <div className="text-xs text-gray-600">
            ${price}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn('calendar-container', className)}>
      <DayPicker
        mode={mode}
        selected={initialDate}
        onSelect={onDateChange}
        disabled={disabledDays}
        numberOfMonths={numberOfMonths}
        components={{
          Day: ({ date }) => renderDay(date)
        }}
        modifiers={{
          booked: disabledDays
        }}
        modifiersStyles={{
          booked: {
            textDecoration: 'line-through',
            color: 'gray'
          }
        }}
        className="border rounded-lg bg-white p-3"
      />
    </div>
  );
}
