import React from 'react';
import { format } from 'date-fns';
import { Bell, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotificationStore } from '@/lib/store/notification-store';

export function NotificationCenter() {
  const { notifications, markAsRead, clearNotification } = useNotificationStore();
  const [showAll, setShowAll] = React.useState(false);

  const displayedNotifications = showAll
    ? notifications
    : notifications.slice(0, 5);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="relative"
        onClick={() => setShowAll(!showAll)}
      >
        <Bell className="h-5 w-5" />
        {notifications.some((n) => !n.read) && (
          <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-red-500" />
        )}
      </Button>

      {showAll && (
        <div className="absolute right-0 top-full z-50 mt-2 w-96 rounded-lg border bg-white p-4 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            {displayedNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`rounded-lg border p-3 ${
                  notification.read ? 'bg-gray-50' : 'bg-blue-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{notification.title}</p>
                    <p className="text-sm text-gray-600">
                      {notification.message}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {format(new Date(notification.createdAt), 'PPp')}
                    </p>
                  </div>
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsRead(notification.id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {notifications.length > 5 && !showAll && (
            <Button
              variant="ghost"
              className="mt-4 w-full"
              onClick={() => setShowAll(true)}
            >
              View All
            </Button>
          )}
        </div>
      )}
    </div>
  );
}