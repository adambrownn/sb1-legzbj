import React from 'react';
import type { PropertyAvailability } from '@/types/property';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

interface AvailabilityCalendarProps {
  availability: PropertyAvailability[];
  className?: string;
}

export function AvailabilityCalendar({ availability, className }: AvailabilityCalendarProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date());

  const getDateStatus = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return availability.find(a => a.date === dateStr)?.status || 'available';
  };

  const getDatePrice = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return availability.find(a => a.date === dateStr)?.price;
  };

  return (
    <div className={cn('rounded-lg border', className)}>
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={setSelectedDate}
        className="rounded-md border"
        modifiers={{
          booked: (date) => getDateStatus(date) === 'booked',
          partial: (date) => getDateStatus(date) === 'partial',
          maintenance: (date) => getDateStatus(date) === 'maintenance',
        }}
        modifiersClassNames={{
          booked: 'bg-red-100 text-red-900',
          partial: 'bg-yellow-100 text-yellow-900',
          maintenance: 'bg-gray-100 text-gray-900',
        }}
        components={{
          DayContent: ({ date }) => (
            <div className="flex flex-col items-center">
              <span>{date.getDate()}</span>
              <span className="text-xs font-medium">
                ${getDatePrice(date)}
              </span>
            </div>
          ),
        }}
      />
      <div className="mt-2 flex flex-wrap gap-2 p-4 text-sm">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-full bg-green-100" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-full bg-red-100" />
          <span>Booked</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-full bg-yellow-100" />
          <span>Partial</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-full bg-gray-100" />
          <span>Maintenance</span>
        </div>
      </div>
    </div>
  );
}