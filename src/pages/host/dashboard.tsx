import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookingManagement } from '@/components/host/booking-management';
import { PropertyAnalytics } from '@/components/host/property-analytics';
import { GuestDemographics } from '@/components/host/guest-demographics';
import { useAuthStore } from '@/lib/store/auth-store';

export function HostDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  if (!user || user.role !== 'host') {
    navigate('/');
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold">Host Dashboard</h1>

      <div className="grid gap-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="mb-4 text-xl font-semibold">Booking Management</h2>
            <BookingManagement hostId={user.id} />
          </div>

          <div>
            <h2 className="mb-4 text-xl font-semibold">Analytics</h2>
            <PropertyAnalytics hostId={user.id} />
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-xl font-semibold">Guest Insights</h2>
          <GuestDemographics hostId={user.id} />
        </div>
      </div>
    </div>
  );
}