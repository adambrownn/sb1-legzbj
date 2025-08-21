import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Home,
  Users,
  MessageSquare,
  Settings,
  Shield,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/store/auth-store';
import { useBookingStore } from '@/lib/store/booking-store';
import { usePropertyStore } from '@/lib/store/property-store';
import { useCurrencyStore } from '@/lib/store/currency-store';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { PropertyForm } from '@/components/properties/property-form';
import { FeedbackManagement } from '@/components/admin/feedback-management';
import type { Booking } from '@/lib/types/booking';
import type { Property } from '@/lib/types/property';
import { z } from 'zod';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const settingsSchema = z.object({
  platformName: z.string().min(1, 'Platform name is required'),
  contactEmail: z.string().email('Invalid email address'),
  minimumStay: z.number().min(1, 'Minimum stay must be at least 1 night'),
  maximumStay: z.number().min(1, 'Maximum stay must be at least 1 night'),
  currency: z.enum(['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD']),
  serviceFee: z.number().min(0, 'Service fee cannot be negative').max(100, 'Service fee cannot exceed 100%'),
});

type Settings = z.infer<typeof settingsSchema>;

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const bookings = useBookingStore((state) => state.bookings);
  const { updateBooking, cancelBooking } = useBookingStore();
  const { properties, isLoading: propertiesLoading, error: propertiesError, loadProperties, deleteProperty } = usePropertyStore();
  const { selectedCurrency, setSelectedCurrency } = useCurrencyStore();
  const [selectedBooking, setSelectedBooking] = React.useState<Booking | null>(null);
  const [showCancelDialog, setShowCancelDialog] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('overview');
  const [showAddPropertyDialog, setShowAddPropertyDialog] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedRole, setSelectedRole] = React.useState('all');
  const [users, setUsers] = React.useState([
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'guest',
      status: 'active',
      lastActive: '2024-03-10',
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'host',
      status: 'active',
      lastActive: '2024-03-11',
    },
  ]);

  const [settings, setSettings] = React.useState<Settings>({
    platformName: 'Rovers Suites',
    contactEmail: 'support@rovers.com',
    minimumStay: 1,
    maximumStay: 30,
    currency: selectedCurrency as Settings['currency'],
    serviceFee: 10,
  });

  const bookingData = bookings.map((booking) => ({
    date: booking.date,
    amount: booking.amount,
  }));

  React.useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (user.role !== 'admin') {
    navigate('/');
    return null;
  }

  if (propertiesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (propertiesError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading dashboard data</p>
          <button 
            onClick={() => loadProperties()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const handleEditBooking = (booking: Booking) => {
    setSelectedBooking(booking);
  };

  const handleCancelBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowCancelDialog(true);
  };

  const confirmCancelBooking = () => {
    if (selectedBooking) {
      const success = cancelBooking(selectedBooking.id, 'Cancelled by admin');
      if (success) {
        toast.success('Booking cancelled successfully');
      } else {
        toast.error('Failed to cancel booking');
      }
      setShowCancelDialog(false);
      setSelectedBooking(null);
    }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      deleteProperty(propertyId);
      toast.success('Property deleted successfully');
    }
  };

  const handleEditProperty = (property: Property) => {
    // TODO: Implement property editing
    toast.info('Property editing coming soon');
  };

  const handleCurrencyChange = (currency: Settings['currency']) => {
    setSettings({ ...settings, currency });
    setSelectedCurrency(currency);
  };

  const handleSaveSettings = () => {
    try {
      settingsSchema.parse(settings);
      // TODO: Save settings to backend
      toast.success('Settings saved successfully');
    } catch (error) {
      if (error instanceof z.ZodError && error.errors.length > 0) {
        toast.error(error.errors[0].message);
      }
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'properties', label: 'Properties', icon: Home },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const renderOverview = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-2">
            <Home className="h-5 w-5 text-blue-600" />
            <h3 className="font-medium">Total Properties</h3>
          </div>
          <p className="mt-2 text-2xl font-bold">{properties.length}</p>
        </div>
      </Card>
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-600" />
            <h3 className="font-medium">Total Users</h3>
          </div>
          <p className="mt-2 text-2xl font-bold">{users.length}</p>
        </div>
      </Card>
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-purple-600" />
            <h3 className="font-medium">Active Bookings</h3>
          </div>
          <p className="mt-2 text-2xl font-bold">
            {bookings.filter((b) => b.status === 'confirmed').length}
          </p>
        </div>
      </Card>
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-yellow-600" />
            <h3 className="font-medium">Total Revenue</h3>
          </div>
          <p className="mt-2 text-2xl font-bold">
            ${bookings.reduce((sum, b) => sum + b.totalPrice, 0).toLocaleString()}
          </p>
        </div>
      </Card>
      <Card>
        <div className="p-6">
          <LineChart
            width={500}
            height={300}
            data={bookingData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="amount" stroke="#8884d8" />
          </LineChart>
        </div>
      </Card>
    </div>
  );

  const renderProperties = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Properties Management</h2>
        <Button onClick={() => setShowAddPropertyDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Property
        </Button>
      </div>

      {propertiesLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-lg bg-white p-4 shadow">
              <div className="mb-4 h-48 w-full rounded bg-gray-200" />
              <div className="h-4 w-3/4 rounded bg-gray-200" />
              <div className="mt-2 h-4 w-1/2 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      ) : propertiesError ? (
        <div className="rounded-lg bg-red-50 p-4 text-red-800">
          {propertiesError}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <Card key={property.id}>
              <img
                src={property.images[0]}
                alt={property.title}
                className="h-48 w-full object-cover"
              />
              <div className="p-4">
                <h3 className="font-semibold">{property.title}</h3>
                <p className="mt-1 text-sm text-gray-600">
                  {property.location.address}
                </p>
                <div className="mt-4 flex justify-between">
                  <p className="font-medium">${property.price}/night</p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditProperty(property)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteProperty(property.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={showAddPropertyDialog}
        onClose={() => setShowAddPropertyDialog(false)}
        title="Add New Property"
      >
        <PropertyForm
          onSuccess={() => {
            setShowAddPropertyDialog(false);
            toast.success('Property added successfully');
          }}
        />
      </Dialog>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">User Management</h2>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-md border border-gray-300 px-4 py-2"
          />
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="rounded-md border border-gray-300 px-4 py-2"
          >
            <option value="all">All Roles</option>
            <option value="guest">Guest</option>
            <option value="host">Host</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      <div className="rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Last Active
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="whitespace-nowrap px-6 py-4">{user.name}</td>
                <td className="whitespace-nowrap px-6 py-4">{user.email}</td>
                <td className="whitespace-nowrap px-6 py-4">
                  <select
                    value={user.role}
                    onChange={(e) =>
                      handleRoleChange(user.id, e.target.value)
                    }
                    className="rounded-md border-gray-300 text-sm"
                  >
                    <option value="guest">Guest</option>
                    <option value="host">Host</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                      user.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {user.status}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {user.lastActive}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteUser(user.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Platform Settings</h2>
        <Button onClick={handleSaveSettings}>Save Changes</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-900">General Settings</h3>
          <Card>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Platform Name
                </label>
                <input
                  type="text"
                  value={settings.platformName}
                  onChange={(e) =>
                    setSettings({ ...settings, platformName: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) =>
                    setSettings({ ...settings, contactEmail: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-900">Booking Settings</h3>
          <Card>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Minimum Stay (nights)
                </label>
                <input
                  type="number"
                  value={settings.minimumStay}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      minimumStay: parseInt(e.target.value),
                    })
                  }
                  min={1}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Maximum Stay (nights)
                </label>
                <input
                  type="number"
                  value={settings.maximumStay}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      maximumStay: parseInt(e.target.value),
                    })
                  }
                  min={1}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-900">Payment Settings</h3>
        <Card>
          <div className="p-4 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Currency
                </label>
                <Select
                  value={settings.currency}
                  options={[
                    { value: 'USD', label: 'US Dollar (USD)' },
                    { value: 'EUR', label: 'Euro (EUR)' },
                    { value: 'GBP', label: 'British Pound (GBP)' },
                    { value: 'INR', label: 'Indian Rupee (INR)' },
                    { value: 'JPY', label: 'Japanese Yen (JPY)' },
                    { value: 'AUD', label: 'Australian Dollar (AUD)' },
                    { value: 'CAD', label: 'Canadian Dollar (CAD)' },
                  ]}
                  onChange={(value) => handleCurrencyChange(value as Settings['currency'])}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Service Fee (%)
                </label>
                <input
                  type="number"
                  value={settings.serviceFee}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      serviceFee: parseInt(e.target.value),
                    })
                  }
                  min={0}
                  max={100}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'properties':
        return renderProperties();
      case 'users':
        return renderUsers();
      case 'feedback':
        return <FeedbackManagement />;
      case 'settings':
        return renderSettings();
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <Select
                value="Last 30 days"
                options={[
                  { value: '7', label: 'Last 7 days' },
                  { value: '30', label: 'Last 30 days' },
                  { value: '90', label: 'Last 90 days' },
                  { value: 'all', label: 'All time' },
                ]}
                onChange={() => {}}
              />
              <Button
                onClick={() => setActiveTab('settings')}
                variant="outline"
                className="gap-2"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mt-6 flex gap-4 border-b">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">{renderContent()}</div>

      {/* Dialogs */}
      <Dialog
        open={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        title="Cancel Booking"
      >
        <div className="space-y-4">
          <p>Are you sure you want to cancel this booking?</p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
            >
              No, keep it
            </Button>
            <Button onClick={confirmCancelBooking}>
              Yes, cancel it
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}