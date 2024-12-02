import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navbar } from '@/components/layout/navbar';
import { FeedbackButton } from '@/components/feedback/feedback-button';
import { UserOnboarding } from '@/components/onboarding/user-onboarding';
import { HomePage } from '@/pages/home';
import { AuthPage } from '@/pages/auth';
import { BookingsPage } from '@/pages/bookings';
import { HostPropertiesPage } from '@/pages/host/properties';
import { HostDashboardPage } from '@/pages/host/dashboard';
import { PropertyDetailsPage } from '@/pages/properties/[id]';
import { AdminDashboardPage } from '@/pages/admin/dashboard';
import { useAuthStore } from '@/lib/store/auth-store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: 2,
    },
  },
});

export default function App() {
  const { user } = useAuthStore();

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/bookings" element={<BookingsPage />} />
            <Route path="/host/properties" element={<HostPropertiesPage />} />
            <Route path="/host/dashboard" element={<HostDashboardPage />} />
            <Route path="/properties/:id" element={<PropertyDetailsPage />} />
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          </Routes>
          <Toaster position="top-center" />
          {user && <UserOnboarding role={user.role} />}
          <FeedbackButton />
        </div>
      </Router>
    </QueryClientProvider>
  );
}