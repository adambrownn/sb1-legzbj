import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/navbar";
import { FeedbackButton } from "@/components/feedback/feedback-button";
import { UserOnboarding } from "@/components/onboarding/user-onboarding";
import { HomePage } from "@/pages/home";
import { AuthPage } from "@/pages/auth";
import { MfaPage } from "@/pages/auth/mfa"; // NEW: Import MFA page
import { ForgotPasswordPage } from '@/pages/auth/forgot-password';
import { ResetPasswordPage } from '@/pages/auth/reset-password';
import { VerifyEmailPage } from '@/pages/auth/verify-email';
import { BookingsPage } from "@/pages/bookings";
import { HostPropertiesPage } from "@/pages/host/properties";
import { HostDashboardPage } from "@/pages/host/dashboard";
import { PropertyDetailsPage } from "@/pages/properties/[id]";
import { AdminDashboardPage } from "@/pages/admin/dashboard";
import ProfilePage from "@/pages/profile";
import { useAuthStore } from "@/lib/store/auth-store";
import PropertiesPage from "@/pages/properties";
import { AboutPage } from '@/pages/about';
import { ContactPage } from '@/pages/contact';
import { PrivacyPage } from '@/pages/privacy';
import { TermsPage } from '@/pages/terms';
import { LiveChat } from "@/components/live-chat/live-chat";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (was cacheTime in v4)
      retry: 2,
    },
  },
});

// Protected Route Component
const ProtectedRoute = ({ 
  children, 
  requiredRoles = [], 
  requireMfa = false 
}: { 
  children: React.ReactNode;
  requiredRoles?: string[];
  requireMfa?: boolean;
}) => {
  const { user, isAuthenticated, isMfaVerified } = useAuthStore();
  
  if (!isAuthenticated || !user) {
    return <Navigate to="/auth?type=login" replace />;
  }
  
  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  
  // FIXED: Proper MFA redirect logic
  if (requireMfa && user.mfaEnabled && !isMfaVerified) {
    return <Navigate to="/auth/mfa" replace />;
  }
  
  return <>{children}</>;
};

// Public Route Component
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-background">
          <Navbar />
          <main>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/properties" element={<PropertiesPage />} />
              <Route path="/properties/:id" element={<PropertyDetailsPage />} />
              
              {/* Auth Routes */}
              <Route path="/auth" element={<PublicRoute><AuthPage /></PublicRoute>} />
              <Route path="/auth/mfa" element={<MfaPage />} /> {/* NEW: MFA route */}
              <Route path="/auth/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
              <Route path="/auth/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />
              <Route path="/auth/verify-email" element={<PublicRoute><VerifyEmailPage /></PublicRoute>} />
              
              {/* Protected Routes */}
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/bookings" element={<ProtectedRoute><BookingsPage /></ProtectedRoute>} />
              
              {/* Host Routes */}
              <Route path="/host/properties" element={
                <ProtectedRoute requiredRoles={['host']} requireMfa={true}>
                  <HostPropertiesPage />
                </ProtectedRoute>
              } />
              <Route path="/host/dashboard" element={
                <ProtectedRoute requiredRoles={['host']} requireMfa={true}>
                  <HostDashboardPage />
                </ProtectedRoute>
              } />
              
              {/* Admin Routes */}
              <Route path="/admin/dashboard" element={
                <ProtectedRoute requiredRoles={['admin']} requireMfa={true}>
                  <AdminDashboardPage />
                </ProtectedRoute>
              } />
              
              {/* Fallback Route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <FeedbackButton />
          <LiveChat />
          <Toaster />
          <UserOnboarding role="guest" />
        </div>
      </Router>
    </QueryClientProvider>
  );
}
