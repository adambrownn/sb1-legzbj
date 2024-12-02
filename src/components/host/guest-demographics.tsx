import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { useBookingStore } from '@/lib/store/booking-store';
import { usePropertyStore } from '@/lib/store/property-store';

interface GuestDemographicsProps {
  hostId: string;
}

const COLORS = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6'];

export function GuestDemographics({ hostId }: GuestDemographicsProps) {
  const bookings = useBookingStore((state) => state.bookings);
  const properties = usePropertyStore((state) =>
    state.properties.filter((p) => p.hostId === hostId)
  );

  const getGuestLocationData = () => {
    const locations = bookings.reduce((acc, booking) => {
      const property = properties.find((p) => p.id === booking.propertyId);
      if (property) {
        const location = booking.guestLocation || 'Unknown';
        acc[location] = (acc[location] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(locations).map(([location, count]) => ({
      name: location,
      value: count,
    }));
  };

  const getGuestGroupSizeData = () => {
    const groupSizes = bookings.reduce((acc, booking) => {
      const property = properties.find((p) => p.id === booking.propertyId);
      if (property) {
        const size = booking.guestCount <= 2 ? 'Small (1-2)'
          : booking.guestCount <= 4 ? 'Medium (3-4)'
          : 'Large (5+)';
        acc[size] = (acc[size] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(groupSizes).map(([size, count]) => ({
      name: size,
      value: count,
    }));
  };

  const locationData = getGuestLocationData();
  const groupSizeData = getGuestGroupSizeData();

  return (
    <div className="space-y-8">
      <div className="rounded-lg border bg-white p-6">
        <h2 className="mb-6 text-xl font-semibold">Guest Demographics</h2>
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h3 className="mb-4 text-lg font-medium">Guest Locations</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={locationData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {locationData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-medium">Group Sizes</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={groupSizeData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {groupSizeData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}