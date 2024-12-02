import React from 'react';
import { format, addDays, isWithinInterval, isBefore, isAfter } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Property } from '@/lib/types/property';

interface DateRangePickerProps {
  property: Property;
  onSelect: (dates: { checkIn: Date; checkOut: Date }) => void;
}

export function DateRangePicker({ property, onSelect }: DateRangePickerProps) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  const [selectedRange, setSelectedRange] = React.useState<{
    start?: Date;
    end?: Date;
  }>({});

  const handleDateClick = (date: Date) => {
    if (!selectedRange.start || (selectedRange.start && selectedRange.end)) {
      setSelectedRange({ start: date });
    } else {
      if (isBefore(date, selectedRange.start)) {
        setSelectedRange({ start: date });
      } else {
        setSelectedRange({ ...selectedRange, end: date });
        onSelect({
          checkIn: selectedRange.start,
          checkOut: date,
        });
      }
    }
  };

  const isDateDisabled = (date: Date) => {
    return property.availability.some((block) =>
      isWithinInterval(date, {
        start: new Date(block.startDate),
        end: new Date(block.endDate),
      })
    );
  };

  const isDateInRange = (date: Date) => {
    if (!selectedRange.start || !selectedRange.end) return false;
    return (
      isAfter(date, selectedRange.start) &&
      isBefore(date, selectedRange.end)
    );
  };

  const renderCalendarDays = () => {
    const days = [];
    const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    // Add empty cells for days before the first of the month
    for (let i = 0; i < start.getDay(); i++) {
      days.push(<div key={`empty-${i}`} />);
    }

    // Add days of the month
    for (let day = 1; day <= end.getDate(); day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isDisabled = isDateDisabled(date);
      const isSelected =
        selectedRange.start?.getTime() === date.getTime() ||
        selectedRange.end?.getTime() === date.getTime();
      const isInRange = isDateInRange(date);

      days.push(
        <button
          key={date.toISOString()}
          onClick={() => !isDisabled && handleDateClick(date)}
          disabled={isDisabled}
          className={`h-10 w-10 rounded-full ${
            isSelected
              ? 'bg-blue-600 text-white'
              : isInRange
              ? 'bg-blue-100'
              : isDisabled
              ? 'cursor-not-allowed bg-gray-100 text-gray-400'
              : 'hover:bg-gray-100'
          }`}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() =>
            setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))
          }
          className="rounded-full p-1 hover:bg-gray-100"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center">
          <CalendarIcon className="mr-2 h-5 w-5 text-gray-500" />
          <span className="font-medium">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
        </div>
        <button
          onClick={() =>
            setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))
          }
          className="rounded-full p-1 hover:bg-gray-100"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="py-2 font-medium text-gray-500">
            {day}
          </div>
        ))}
        {renderCalendarDays()}
      </div>

      {selectedRange.start && !selectedRange.end && (
        <p className="mt-4 text-center text-sm text-gray-600">
          Select your check-out date
        </p>
      )}
    </div>
  );
}