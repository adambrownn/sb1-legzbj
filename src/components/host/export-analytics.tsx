import React from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBookingStore } from '@/lib/store/booking-store';
import { usePropertyStore } from '@/lib/store/property-store';

interface ExportAnalyticsProps {
  hostId: string;
}

export function ExportAnalytics({ hostId }: ExportAnalyticsProps) {
  const bookings = useBookingStore((state) => state.bookings);
  const properties = usePropertyStore((state) =>
    state.properties.filter((p) => p.hostId === hostId)
  );

  const generateReport = () => {
    const propertyData = properties.map((property) => {
      const propertyBookings = bookings.filter((b) => b.propertyId === property.id);
      const totalRevenue = propertyBookings.reduce((sum, b) => sum + b.totalPrice, 0);
      const occupancyRate = (propertyBookings.length / 365) * 100;

      return {
        propertyName: property.title,
        totalBookings: propertyBookings.length,
        totalRevenue,
        occupancyRate: occupancyRate.toFixed(2) + '%',
        averageRating: 4.5, // Placeholder for actual rating calculation
        popularAmenities: property.amenities.slice(0, 3),
      };
    });

    const reportData = {
      generatedAt: new Date().toISOString(),
      properties: propertyData,
      summary: {
        totalProperties: properties.length,
        totalBookings: bookings.length,
        totalRevenue: propertyData.reduce((sum, p) => sum + p.totalRevenue, 0),
        averageOccupancy: propertyData.reduce((sum, p) => sum + parseFloat(p.occupancyRate), 0) / properties.length + '%',
      },
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Button
      onClick={generateReport}
      variant="outline"
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      Export Analytics
    </Button>
  );
}