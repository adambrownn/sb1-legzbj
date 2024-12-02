import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { format, subMonths, eachMonthOfInterval } from 'date-fns';
import { useBookingStore } from '@/lib/store/booking-store';
import { usePropertyStore } from '@/lib/store/property-store';
import { AnalyticsTooltip } from './analytics-tooltip';
import { ExportAnalytics } from './export-analytics';

interface PropertyAnalyticsProps {
  hostId: string;
}

const COLORS = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b'];

export function PropertyAnalytics({ hostId }: PropertyAnalyticsProps) {
  const bookings = useBookingStore((state) => state.bookings);
  const properties = usePropertyStore((state) =>
    state.properties.filter((p) => p.hostId === hostId)
  );

  const getMonthlyData = () => {
    const today = new Date();
    const sixMonthsAgo = subMonths(today, 6);
    const months = eachMonthOfInterval({ start: sixMonthsAgo, end: today });

    return months.map((month) => {
      const monthBookings = bookings.filter((booking) => {
        const bookingDate = new Date(booking.createdAt);
        return (
          bookingDate.getMonth() === month.getMonth() &&
          bookingDate.getFullYear() === month.getFullYear()
        );
      });

      return {
        month: format(month, 'MMM yyyy'),
        revenue: monthBookings.reduce((sum, booking) => sum + booking.totalPrice, 0),
        bookings: monthBookings.length,
      };
    });
  };

  const getBookingStatusData = () => {
    const statusCounts = bookings.reduce((acc, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
    }));
  };

  const monthlyData = getMonthlyData();
  const statusData = getBookingStatusData();

  return (
    <div className="space-y-8">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center">
          <h2 className="text-xl font-semibold">Analytics Dashboard</h2>
          <AnalyticsTooltip
            title="Analytics Overview"
            content="View your property performance metrics, including revenue trends and booking status distribution."
          />
        </div>
        <ExportAnalytics hostId={hostId} />
      </div>

      <div className="rounded-lg border bg-white p-6">
        <div className="mb-4 flex items-center">
          <h3 className="text-lg font-semibold">Revenue Trends</h3>
          <AnalyticsTooltip
            title="Revenue Trends"
            content="Track your monthly revenue and booking counts."
          />
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                name="Revenue ($)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="bookings"
                stroke="#10b981"
                name="Bookings"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-6">
        <div className="mb-4 flex items-center">
          <h3 className="text-lg font-semibold">Booking Status Distribution</h3>
          <AnalyticsTooltip
            title="Booking Status"
            content="View the distribution of booking statuses across your properties."
          />
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {statusData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}