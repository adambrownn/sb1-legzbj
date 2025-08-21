import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/lib/store/auth-store';
import { RewardsCard } from '@/components/rewards/rewards-card';
import { RedeemPoints } from '@/components/rewards/redeem-points';
import { MfaSetup } from '@/components/profile/mfa-setup'; // NEW: Import MFA component
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Settings, History, Mail, UserCircle, Shield } from 'lucide-react'; // NEW: Import Shield icon

export default function ProfilePage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!user) {
      navigate('/auth?type=login');
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4 mt-16">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Profile Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <CardTitle className="text-2xl">{user.name}</CardTitle>
                <div className="flex items-center text-gray-500 space-x-4">
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-1" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center">
                    <UserCircle className="w-4 h-4 mr-1" />
                    <span className="capitalize">{user.role}</span>
                  </div>
                  {/* NEW: MFA Status Indicator */}
                  <div className="flex items-center">
                    <Shield className={`w-4 h-4 mr-1 ${user.mfaEnabled ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className={user.mfaEnabled ? 'text-green-600' : 'text-gray-500'}>
                      {user.mfaEnabled ? 'MFA Enabled' : 'MFA Disabled'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Profile Content */}
        <Tabs defaultValue="rewards" className="space-y-6">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="rewards" className="space-x-2">
              <History className="w-4 h-4" />
              <span>Rewards</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="space-x-2">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </TabsTrigger>
            {/* NEW: Security Tab */}
            <TabsTrigger value="security" className="space-x-2">
              <Shield className="w-4 h-4" />
              <span>Security</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rewards" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <RewardsCard />
              <RedeemPoints />
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-medium">Personal Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-500">Name</label>
                      <p className="font-medium">{user.name}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Email</label>
                      <p className="font-medium">{user.email}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium">Account Type</h3>
                  <p className="capitalize">{user.role}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* NEW: Security Tab Content */}
          <TabsContent value="security" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Security Settings</h2>
              <MfaSetup />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}