import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Search, Calendar, Users, X, Minus, Plus, MapPin } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { MOCK_PROPERTIES } from '@/data/properties';

interface ExpandableSearchBarProps {
  onSearch: (query: {
    location: string;
    checkIn: Date | null;
    checkOut: Date | null;
    guests: number;
  }) => void;
  onStateUpdate: (state: {
    location?: string;
    checkIn?: Date | null;
    checkOut?: Date | null;
    guests?: number;
  }) => void;
  initialState: {
    location: string;
    checkIn: Date | null;
    checkOut: Date | null;
    guests: number;
  };
  isCollapsed?: boolean;
  className?: string;
}

export const ExpandableSearchBar: React.FC<ExpandableSearchBarProps> = ({
  onSearch,
  onStateUpdate,
  initialState,
  isCollapsed = false,
  className = "",
}) => {
  const navigate = useNavigate();
  const [location, setLocation] = useState(initialState.location);
  const [checkIn, setCheckIn] = useState<Date | null>(initialState.checkIn);
  const [checkOut, setCheckOut] = useState<Date | null>(initialState.checkOut);
  const [guests, setGuests] = useState(initialState.guests);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerPosition, setDatePickerPosition] = useState({ top: 0, left: 0 });
  const searchBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocation(initialState.location);
    setCheckIn(initialState.checkIn);
    setCheckOut(initialState.checkOut);
    setGuests(initialState.guests);
  }, [initialState]);

  const handleGuestsChange = (newGuests: number) => {
    const updatedGuests = Math.max(1, newGuests);
    setGuests(updatedGuests);
    onStateUpdate({ guests: updatedGuests });
  };

  const handleDateChange = (type: 'checkIn' | 'checkOut', date: Date | null) => {
    if (type === 'checkIn') {
      setCheckIn(date);
      onStateUpdate({ checkIn: date });
      console.log("checkIn updated to:", date);
      if (date && checkOut && date > checkOut) {
        setCheckOut(null);
        onStateUpdate({ checkOut: null });
      }
    } else {
      setCheckOut(date);
      onStateUpdate({ checkOut: date });
      console.log("checkOut updated to:", date);
    }
  };

  const handleLocationChange = (newLocation: string) => {
    setLocation(newLocation);
    onStateUpdate({ location: newLocation });
    setShowSuggestions(true);
  };

  const handleCalendarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    let left = rect.left;
    let top = rect.bottom + 8;
    if (window.innerWidth <= 640) {
      left = Math.min(window.innerWidth - 20, Math.max(20, left));
    } else if (left + 500 > window.innerWidth) {
      left = window.innerWidth - 520;
    }
    setDatePickerPosition({ top, left });
    setShowDatePicker(true);
  };

  const renderDateDisplay = () => {
    if (checkIn && checkOut) {
      return `${format(checkIn, 'MMM d')} - ${format(checkOut, 'MMM d')}`;
    } else if (checkIn) {
      return `${format(checkIn, 'MMM d')} - Select Check-Out`;
    }
    return 'Add dates';
  };

  const renderDatePicker = () => (
    <div 
      className="fixed bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-[100]"
      style={{
        top: datePickerPosition.top,
        left: datePickerPosition.left,
        width: window.innerWidth <= 640 ? 'calc(100% - 32px)' : '500px',
      }}
      onClick={e => e.stopPropagation()}
    >
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Check-in</label>
          <DatePicker
            selected={checkIn}
            onChange={(date: Date | null) => {
              if (date) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (date < today) {
                  return;
                }
                handleDateChange('checkIn', date);
                if (checkOut && date > checkOut) {
                  handleDateChange('checkOut', null);
                }
              }
            }}
            selectsStart
            startDate={checkIn}
            endDate={checkOut}
            minDate={new Date()}
            dateFormat="MMM d, yyyy"
            inline
            calendarClassName="shadow-lg border border-gray-200 rounded-lg"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Check-out</label>
          <DatePicker
            selected={checkOut}
            onChange={(date: Date | null) => {
              if (date) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (date < today) {
                  return;
                }
                if (!checkIn || date > checkIn) {
                  handleDateChange('checkOut', date);
                }
              }
            }}
            selectsEnd
            startDate={checkIn}
            endDate={checkOut}
            minDate={checkIn || new Date()}
            dateFormat="MMM d, yyyy"
            inline
            calendarClassName="shadow-lg border border-gray-200 rounded-lg"
          />
        </div>
      </div>
      <div className="flex justify-end mt-4">
        <button
          type="button"
          onClick={() => setShowDatePicker(false)}
          className="px-4 py-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors duration-200"
        >
          Done
        </button>
      </div>
    </div>
  );

  const datePickerPortal = showDatePicker && createPortal(
    renderDatePicker(),
    document.body
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      console.log("handleClickOutside triggered", event, "Target:", target);

      // Prioritize checking inside clicks first
      // Check if click is inside any DatePicker popper or day
      const datePickerElements = document.querySelectorAll('.react-datepicker, .react-datepicker-popper, .react-datepicker__day');
      for (let element of datePickerElements) {
        if (element.contains(target)) {
          console.log("Click inside DatePicker detected");
          return;
        }
      }

      // Check if click is inside the search bar
      if (searchBarRef.current?.contains(target)) {
        console.log("Click inside searchBar detected");
        return;
      }

      console.log("Click outside detected");
      setShowDatePicker(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchBarRef, showDatePicker]);

  const handleSearch = () => {
    onSearch({
      location,
      checkIn,
      checkOut,
      guests
    });
    setShowDatePicker(false);
  };

  return (
    <div ref={searchBarRef} className={cn("relative w-full", className)}>
      {datePickerPortal}
      <div className="flex items-center gap-4 bg-white border rounded-full px-4 py-2">
        <input
          type="text"
          className="flex-grow bg-transparent outline-none text-sm"
          placeholder="Where are you going?"
          value={location}
          onChange={(e) => handleLocationChange(e.target.value)}
        />
        <div 
          className="flex items-center px-4 border-l border-gray-200 cursor-pointer"
          onClick={handleCalendarClick}
        >
          <Calendar className="h-5 w-5 text-gray-400" />
          <span className="ml-2 text-sm text-gray-600">
            {renderDateDisplay()}
          </span>
        </div>
        <div className="flex items-center px-4 border-l border-gray-200">
          <Users className="h-5 w-5 text-gray-400" />
          <div className="flex items-center ml-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleGuestsChange(guests - 1);
              }}
              className="p-1 hover:bg-gray-100 rounded-full"
              aria-label="Decrease guests"
            >
              <Minus className="h-3 w-3 text-gray-500" />
            </button>
            <span className="mx-2 text-sm min-w-[20px] text-center">{guests}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleGuestsChange(guests + 1);
              }}
              className="p-1 hover:bg-gray-100 rounded-full"
              aria-label="Increase guests"
            >
              <Plus className="h-3 w-3 text-gray-500" />
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSearch}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-full hover:bg-primary-dark"
        >
          <Search className="h-5 w-5" />
          Search
        </button>
      </div>
    </div>
  );
};

export default ExpandableSearchBar;
