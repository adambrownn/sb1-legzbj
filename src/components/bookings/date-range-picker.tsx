import React, { useEffect } from 'react';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AvailabilityService } from '@/lib/services/availability.service';
import { useToast } from '@/hooks/use-toast';

interface DateRangePickerProps {
  propertyId: string;
  selectedDates: {
    checkIn: Date | null;
    checkOut: Date | null;
  };
  onChange: (dates: { checkIn: Date | null; checkOut: Date | null }) => void;
  error?: string;
}

export function DateRangePicker({
  propertyId,
  selectedDates,
  onChange,
  error,
}: DateRangePickerProps) {
  const { toast } = useToast();
  const availabilityService = AvailabilityService.getInstance();

  useEffect(() => {
    // Subscribe to real-time calendar updates
    availabilityService.subscribeToPropertyUpdates(propertyId);

    // Clean up subscription on unmount
    return () => {
      availabilityService.unsubscribeFromPropertyUpdates(propertyId);
    };
  }, [propertyId]);

  const handleDateSelect = async (date: Date | undefined) => {
    if (!date) return;

    try {
      // Check if the selected date is available
      const isAvailable = await availabilityService.isAvailable(
        propertyId,
        format(date, 'yyyy-MM-dd'),
        format(date, 'yyyy-MM-dd'),
        Intl.DateTimeFormat().resolvedOptions().timeZone
      );

      if (!isAvailable) {
        toast({
          title: 'Date Unavailable',
          description: 'The selected date is not available for booking.',
          variant: 'destructive',
        });
        return;
      }

      // Update selected dates based on current selection state
      if (!selectedDates.checkIn || (selectedDates.checkIn && selectedDates.checkOut)) {
        // Start new selection
        onChange({ checkIn: date, checkOut: null });
      } else {
        // Complete the range
        if (date < selectedDates.checkIn) {
          onChange({ checkIn: date, checkOut: selectedDates.checkIn });
        } else {
          onChange({ checkIn: selectedDates.checkIn, checkOut: date });
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to check date availability. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="w-full">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !selectedDates.checkIn && "text-muted-foreground",
              error && "border-red-500"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDates.checkIn ? (
              selectedDates.checkOut ? (
                <>
                  {format(selectedDates.checkIn, "PPP")} -{" "}
                  {format(selectedDates.checkOut, "PPP")}
                </>
              ) : (
                format(selectedDates.checkIn, "PPP")
              )
            ) : (
              <span>Select dates</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            defaultMonth={selectedDates.checkIn || new Date()}
            selected={{
              from: selectedDates.checkIn || undefined,
              to: selectedDates.checkOut || undefined,
            }}
            onSelect={(range) => {
              if (range?.from) {
                handleDateSelect(range.from);
              }
              if (range?.to) {
                handleDateSelect(range.to);
              }
            }}
            numberOfMonths={2}
            disabled={{ before: new Date() }}
          />
        </PopoverContent>
      </Popover>
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}