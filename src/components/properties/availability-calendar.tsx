import React from 'react';
import { format, isWithinInterval, parse } from 'date-fns';
import type { PropertyAvailability } from '@/lib/types/property';

interface AvailabilityCalendarProps {
  availability: PropertyAvailability[];
  isHost?: boolean;
  onDateSelect?: (date: Date) => void;
}

export function AvailabilityCalendar({
  availability,
  isHost = false,
  onDateSelect,
}: AvailabilityCalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const date = new Date(year, month, day);
      const isBooked = availability.some((period) =>
        isWithinInterval(date, {
          start: parse(period.startDate, 'yyyy-MM-dd', new Date()),
          end: parse(period.endDate, 'yyyy-MM-dd', new Date()),
        })
      );

      return {
        date,
        isBooked,
      };
    });
  };

  const days = getDaysInMonth(currentMonth);

  return (
    <div className="rounded-lg border p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() =>
              setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))
            }
            className="rounded-md p-1 hover:bg-gray-100"
          >
            Previous
          </button>
          <button
            onClick={() =>
              setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))
            }
            className="rounded-md p-1 hover:bg-gray-100"
          >
            Next
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
        {days.map(({ date, isBooked }) => (
          <button
            key={date.toISOString()}
            onClick={() => onDateSelect?.(date)}
            disabled={!isHost && isBooked}
            className={`aspect-square rounded-md p-2 text-sm ${
              isBooked
                ? 'bg-red-100 text-red-800'
                : 'hover:bg-blue-100 hover:text-blue-800'
            }`}
          >
            {format(date, 'd')}
          </button>
        ))}
      </div>
    </div>
  );
}