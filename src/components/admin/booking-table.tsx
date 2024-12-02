import React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  createColumnHelper,
  flexRender,
} from '@tanstack/react-table';
import { format } from 'date-fns';
import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Booking } from '@/lib/types/booking';

interface BookingTableProps {
  bookings: Booking[];
  onEditBooking: (booking: Booking) => void;
  onCancelBooking: (booking: Booking) => void;
}

export function BookingTable({ bookings, onEditBooking, onCancelBooking }: BookingTableProps) {
  const columnHelper = createColumnHelper<Booking>();

  const columns = [
    columnHelper.accessor('propertyId', {
      header: 'Property',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('checkIn', {
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="gap-2"
        >
          Check-in
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      ),
      cell: (info) => format(new Date(info.getValue()), 'PPP'),
    }),
    columnHelper.accessor('checkOut', {
      header: 'Check-out',
      cell: (info) => format(new Date(info.getValue()), 'PPP'),
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: (info) => (
        <span className={`rounded-full px-2 py-1 text-sm ${
          info.getValue() === 'confirmed' ? 'bg-green-100 text-green-800' :
          info.getValue() === 'cancelled' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor('totalPrice', {
      header: 'Total',
      cell: (info) => `$${info.getValue()}`,
    }),
    columnHelper.display({
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEditBooking(row.original)}
          >
            Edit
          </Button>
          {row.original.status === 'confirmed' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCancelBooking(row.original)}
              className="text-red-600 hover:bg-red-50"
            >
              Cancel
            </Button>
          )}
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data: bookings,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="rounded-lg border bg-white">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b bg-gray-50">
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-6 py-4 text-sm text-gray-900">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}