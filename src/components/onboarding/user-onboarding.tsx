import React from 'react';
import Joyride, { Step, CallBackProps } from 'react-joyride';
import { useAuthStore } from '@/lib/store/auth-store';

interface UserOnboardingProps {
  role: 'guest' | 'host' | 'admin';
}

export function UserOnboarding({ role }: UserOnboardingProps) {
  const [run, setRun] = React.useState(true);
  const { user } = useAuthStore();

  const getSteps = (): Step[] => {
    switch (role) {
      case 'guest':
        return [
          {
            target: '.search-bar',
            content: 'Search for properties by location, dates, or amenities',
            disableBeacon: true,
            placement: 'bottom',
          },
          {
            target: '.property-filters',
            content: 'Filter properties by price range, amenities, and more',
            placement: 'right',
          },
          {
            target: '.booking-calendar',
            content: 'Select your check-in and check-out dates',
            placement: 'left',
          },
          {
            target: '.notifications',
            content: 'View booking updates and messages here',
            placement: 'bottom',
          },
        ];
      case 'host':
        return [
          {
            target: '.property-management',
            content: 'Manage your properties and listings',
            disableBeacon: true,
            placement: 'bottom',
          },
          {
            target: '.booking-requests',
            content: 'View and manage booking requests',
            placement: 'right',
          },
          {
            target: '.analytics-dashboard',
            content: 'Track your property performance and revenue',
            placement: 'left',
          },
          {
            target: '.guest-insights',
            content: 'Understand your guest demographics and preferences',
            placement: 'top',
          },
        ];
      case 'admin':
        return [
          {
            target: '.admin-dashboard',
            content: 'Monitor platform activity and performance',
            disableBeacon: true,
            placement: 'bottom',
          },
          {
            target: '.user-management',
            content: 'Manage users and their permissions',
            placement: 'right',
          },
          {
            target: '.booking-analytics',
            content: 'View booking trends and revenue insights',
            placement: 'left',
          },
          {
            target: '.support-tickets',
            content: 'Handle user support requests and issues',
            placement: 'top',
          },
        ];
      default:
        return [];
    }
  };

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type } = data;
    const finishedStatuses: string[] = ['finished', 'skipped'];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem(`onboarding-${role}-completed`, 'true');
    }
  };

  if (!user) return null;

  const hasCompletedOnboarding = localStorage.getItem(`onboarding-${role}-completed`);
  if (hasCompletedOnboarding) return null;

  return (
    <Joyride
      steps={getSteps()}
      run={run}
      continuous
      showProgress
      showSkipButton
      spotlightPadding={4}
      disableOverlayClose
      styles={{
        options: {
          primaryColor: '#3b82f6',
          zIndex: 1000,
          overlayColor: 'rgba(0, 0, 0, 0.5)',
        },
        spotlight: {
          borderRadius: '8px',
        },
        tooltip: {
          borderRadius: '8px',
        },
      }}
      callback={handleJoyrideCallback}
    />
  );
}