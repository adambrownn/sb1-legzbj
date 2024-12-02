import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { useBookingStore } from '@/lib/store/booking-store';

export function BookingAnalytics() {
  const bookings = useBookingStore((state) => state.bookings);

  const getMonthlyData = () => {
    const today = new Date();
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return days.map((day) => {
      const dayBookings = bookings.filter(
        (booking) => format(new Date(booking.createdAt), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
      );

      return {
        date: format(day, 'MMM dd'),
        bookings: dayBookings.length,
        revenue: dayBookings.reduce((sum, booking) => sum + booking.totalPrice, 0),
      };
    });
  };

  const data = getMonthlyData();

  return (
    <div className="rounded-lg border bg-white p-6">
      <h2 className="mb-6 text-xl font-semibold">Monthly Booking Analytics</h2>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Bar yAxisId="left" dataKey="bookings" fill="#3b82f6" name="Bookings" />
            <Bar yAxisId="right" dataKey="revenue" fill="#10b981" name="Revenue ($)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}