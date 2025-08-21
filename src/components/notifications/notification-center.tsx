import React from 'react';
import { format } from 'date-fns';
import { Bell, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotificationStore } from '@/lib/store/notification-store';

export function NotificationCenter() {
  const { notifications, markAsRead, clearNotification, addNotification, clearAllRead } = useNotificationStore();
  const [showAll, setShowAll] = React.useState(false);
  const [preferences, setPreferences] = React.useState({
    email: true,
    sms: false,
    push: true,
    autoRemoveRead: true,
  });

  // Auto-remove read notifications after 5 seconds if preference is enabled
  React.useEffect(() => {
    if (preferences.autoRemoveRead) {
      const readNotifications = notifications.filter(n => n.read);
      readNotifications.forEach(notification => {
        setTimeout(() => {
          clearNotification(notification.id);
        }, 5000);
      });
    }
  }, [notifications, preferences.autoRemoveRead, clearNotification]);

  // Filter notifications based on showAll state
  const visibleNotifications = showAll
    ? notifications
    : notifications.filter(n => !n.read);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
  };

  const handleClearNotification = (id: string) => {
    clearNotification(id);
  };

  const handleToggleShowAll = () => {
    setShowAll(!showAll);
  };

  const handleClearAllRead = () => {
    clearAllRead();
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={handleToggleShowAll}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </Button>

      {showAll && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border p-4 z-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Notifications</h3>
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAllRead}
              >
                Clear All Read
              </Button>
            )}
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {visibleNotifications.length === 0 ? (
              <p className="text-gray-500 text-center">No notifications</p>
            ) : (
              visibleNotifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border ${
                    notification.read ? 'bg-gray-50' : 'bg-white'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium">{notification.title}</h4>
                      <p className="text-sm text-gray-600">{notification.message}</p>
                      <span className="text-xs text-gray-400">
                        {format(new Date(notification.createdAt), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleClearNotification(notification.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Notification Preferences</h4>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.email}
                  onChange={e => setPreferences(p => ({ ...p, email: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm">Email Notifications</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.push}
                  onChange={e => setPreferences(p => ({ ...p, push: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm">Push Notifications</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.autoRemoveRead}
                  onChange={e => setPreferences(p => ({ ...p, autoRemoveRead: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm">Auto-remove Read Notifications</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}