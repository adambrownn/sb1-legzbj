import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Menu, User, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { NotificationCenter } from '@/components/notifications/notification-center';
import { useAuthStore } from '@/lib/store/auth-store';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  return (
    <nav className="border-b bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-blue-600">
              Rovers Suites
            </Link>
          </div>

          <div className="hidden md:block">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for places..."
                className="w-96 rounded-full border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <NotificationCenter />
                {user?.role === 'host' && (
                  <Button
                    variant="outline"
                    onClick={() => navigate('/host/properties')}
                  >
                    Manage Properties
                  </Button>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">{user?.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => navigate('/auth?type=register')}
                >
                  Become a Host
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => navigate('/auth?type=login')}
                >
                  <User className="h-5 w-5" />
                  Sign in
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}