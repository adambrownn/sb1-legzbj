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
import { saveAs } from 'file-saver';

const exportToCSV = (data: any[], filename: string) => {
  const csvContent = [
    ['Date', 'Bookings', 'Revenue'],
    ...data.map((row) => [row.date, row.bookings, row.revenue]),
  ]
    .map((e) => e.join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, filename);
};

const exportToPDF = async (data: any[], filename: string) => {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();

  doc.text('Monthly Booking Analytics', 10, 10);

  const tableColumn = ['Date', 'Bookings', 'Revenue'];
  const tableRows: any[] = [];

  data.forEach((row) => {
    const rowData = [row.date, row.bookings.toString(), row.revenue.toString()];
    tableRows.push(rowData);
  });

  doc.autoTable(tableColumn, tableRows, { startY: 20 });
  doc.save(filename);
};

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
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => exportToCSV(data, 'booking-analytics.csv')}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Export to CSV
        </button>
        <button
          onClick={() => exportToPDF(data, 'booking-analytics.pdf')}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Export to PDF
        </button>
      </div>
    </div>
  );
}