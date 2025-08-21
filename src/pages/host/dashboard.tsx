import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Users, Home, Calendar } from 'lucide-react';
import { BookingManagement } from '@/components/host/booking-management';
import { PropertyAnalytics } from '@/components/host/property-analytics';
import { GuestDemographics } from '@/components/host/guest-demographics';
import { useAuthStore } from '@/lib/store/auth-store';
import { usePropertyStore } from '@/lib/store/property-store';
import { useBookingStore } from '@/lib/store/booking-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader } from '@/components/ui/loader';

export function HostDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = React.useState('overview');
  const [isLoading, setIsLoading] = React.useState(true);
  const [stats, setStats] = React.useState({
    totalProperties: 0,
    activeBookings: 0,
    totalGuests: 0,
    totalRevenue: 0,
  });

  const properties = usePropertyStore((state) => 
    state.properties.filter((p) => p.hostId === user?.id)
  );
  const bookings = useBookingStore((state) => state.bookings);

  React.useEffect(() => {
    const fetchDashboardStats = async () => {
      setIsLoading(true);
      try {
        // Simulate API call with setTimeout
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // TODO: Replace with actual API calls
        const hostBookings = bookings.filter((booking) => {
          const property = properties.find((p) => p.id === booking.propertyId);
          return property?.hostId === user.id;
        });

        setStats({
          totalProperties: properties.length,
          activeBookings: hostBookings.filter(b => b.status === 'confirmed').length,
          totalGuests: hostBookings.reduce((sum, b) => sum + (b.guestCount || 1), 0),
          totalRevenue: hostBookings.reduce((sum, b) => sum + b.totalPrice, 0),
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardStats();
  }, [bookings, properties, user]);

  if (!user || user.role !== 'host') {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="border-b bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <h1 className="text-2xl font-bold">Host Dashboard</h1>
            <Button
              onClick={() => navigate('/host/properties')}
              className="gap-2"
            >
              <Home className="h-4 w-4" />
              Manage Properties
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid gap-4 py-6 md:grid-cols-4">
            <Card>
              <CardContent className="flex items-center gap-4">
                <div className="rounded-lg bg-blue-100 p-3">
                  <Home className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Properties</p>
                  {isLoading ? (
                    <div className="flex h-8 items-center">
                      <Loader className="h-4 w-4" />
                    </div>
                  ) : (
                    <p className="text-2xl font-semibold">{stats.totalProperties}</p>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4">
                <div className="rounded-lg bg-green-100 p-3">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Bookings</p>
                  {isLoading ? (
                    <div className="flex h-8 items-center">
                      <Loader className="h-4 w-4" />
                    </div>
                  ) : (
                    <p className="text-2xl font-semibold">{stats.activeBookings}</p>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4">
                <div className="rounded-lg bg-purple-100 p-3">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Guests</p>
                  {isLoading ? (
                    <div className="flex h-8 items-center">
                      <Loader className="h-4 w-4" />
                    </div>
                  ) : (
                    <p className="text-2xl font-semibold">{stats.totalGuests}</p>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4">
                <div className="rounded-lg bg-yellow-100 p-3">
                  <BarChart3 className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Revenue</p>
                  {isLoading ? (
                    <div className="flex h-8 items-center">
                      <Loader className="h-4 w-4" />
                    </div>
                  ) : (
                    <p className="text-2xl font-semibold">${stats.totalRevenue.toLocaleString()}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-4 border-b">
            {['overview', 'bookings', 'analytics', 'guests'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`border-b-2 px-4 py-2 text-sm font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {activeTab === 'overview' && (
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <h2 className="mb-4 text-xl font-semibold">Recent Bookings</h2>
              <BookingManagement hostId={user.id} />
            </div>
            <div>
              <h2 className="mb-4 text-xl font-semibold">Analytics Overview</h2>
              <PropertyAnalytics hostId={user.id} />
            </div>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div>
            <h2 className="mb-4 text-xl font-semibold">Booking Management</h2>
            <BookingManagement hostId={user.id} />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div>
            <h2 className="mb-4 text-xl font-semibold">Property Analytics</h2>
            <PropertyAnalytics hostId={user.id} />
          </div>
        )}

        {activeTab === 'guests' && (
          <div>
            <h2 className="mb-4 text-xl font-semibold">Guest Insights</h2>
            <GuestDemographics hostId={user.id} />
          </div>
        )}
      </div>
    </div>
  );
}