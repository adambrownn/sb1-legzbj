import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/lib/store/auth-store';
import { UserRole } from '@/lib/store/auth-store';
import { MFASetup } from './mfa-setup';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  requireMfa?: boolean;
}

export function ProtectedRoute({
  children,
  requiredRoles,
  requireMfa = false,
}: ProtectedRouteProps) {
  const location = useLocation();
  const { user, isAuthenticated, isMfaEnabled, isMfaVerified } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/auth?type=login" state={{ from: location }} replace />;
  }

  // Check if user has required role
  if (requiredRoles && !requiredRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // Check if MFA is required but not set up
  if (requireMfa && !isMfaEnabled && (user.role === 'host' || user.role === 'admin')) {
    return <MFASetup />;
  }

  // Check if MFA is enabled but not verified
  if (requireMfa && isMfaEnabled && !isMfaVerified && (user.role === 'host' || user.role === 'admin')) {
    return <Navigate to="/auth?type=login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
