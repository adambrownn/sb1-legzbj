import React from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/store/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export function MfaSetup() {
  const { user, enableMfa, verifyMfaSetup } = useAuthStore();
  const [step, setStep] = React.useState<'disabled' | 'setup' | 'verify' | 'enabled'>('disabled');
  const [qrCode, setQrCode] = React.useState<string>('');
  const [secret, setSecret] = React.useState<string>('');
  const [verificationCode, setVerificationCode] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (user?.mfaEnabled) {
      setStep('enabled');
    }
  }, [user]);

  const handleEnableMfa = async () => {
    try {
      setIsLoading(true);
      console.log('🔧 DEBUG: Starting MFA enable for user:', user?.email);
      console.log('🔧 DEBUG: User authenticated?', !!user);
      console.log('🔧 DEBUG: Auth token exists?', !!localStorage.getItem('accessToken'));
      
      const result = await enableMfa();
      console.log('🔧 DEBUG: MFA enable result:', result);
      
      setQrCode(result.qrCodeUrl);
      setSecret(result.secret);
      setStep('setup');
      toast.success('MFA setup initiated. Please scan the QR code.');
    } catch (error: any) {
      console.error('🔧 DEBUG: MFA enable error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack
      });
      
      // 🔧 FIXED: Better error handling
      if (error.response?.status === 401) {
        toast.error('Authentication failed. Please log in again.');
      } else if (error.response?.status === 500) {
        toast.error('Server error. Please try again later.');
      } else {
        toast.error(error.message || 'Failed to enable MFA. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    try {
      setIsLoading(true);
      console.log('Calling verifyMfaSetup with token:', verificationCode); // DEBUG LOG
      
      await verifyMfaSetup(verificationCode); // FIXED: Use verifyMfaSetup
      setStep('enabled');
      toast.success('MFA enabled successfully!');
    } catch (error: any) {
      console.error('MFA verification error:', error); // DEBUG LOG
      toast.error(error.message || 'Invalid verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableMfa = async () => {
    toast.info('MFA disable feature will be implemented soon');
  };

  if (step === 'enabled') {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-green-800">✅ MFA Enabled</h3>
              <p className="text-sm text-gray-600">
                Your account is protected with two-factor authentication
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleDisableMfa}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              Disable MFA
            </Button>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-700">
              📱 Use your authenticator app to generate codes when logging in
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (step === 'setup') {
    return (
      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium">Setup Two-Factor Authentication</h3>
            <p className="text-sm text-gray-600">
              Scan this QR code with your authenticator app
            </p>
          </div>

          <div className="text-center">
            {qrCode && (
              <div className="inline-block p-4 bg-white border rounded-lg">
                <img 
                  src={qrCode} 
                  alt="MFA QR Code" 
                  className="mx-auto"
                  style={{ width: 200, height: 200 }}
                />
              </div>
            )}
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-800">📱 Recommended Apps:</h4>
            <ul className="text-sm text-blue-700 mt-2 space-y-1">
              <li>• Google Authenticator (iOS/Android)</li>
              <li>• Microsoft Authenticator (iOS/Android)</li>
              <li>• Authy (iOS/Android/Desktop)</li>
              <li>• 1Password (Premium)</li>
            </ul>
          </div>

          {secret && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-800">Manual Entry Key:</h4>
              <p className="text-sm text-gray-600 mt-1">
                If you can't scan the QR code, enter this key manually:
              </p>
              <code className="block mt-2 p-2 bg-white rounded border text-sm font-mono">
                {secret}
              </code>
            </div>
          )}

          <form onSubmit={handleVerifySetup} className="space-y-4">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                Enter the 6-digit code from your app
              </label>
              <Input
                id="code"
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                placeholder="123456"
                className="text-center text-2xl font-mono tracking-widest mt-1"
                required
              />
            </div>
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setStep('disabled')}
                className="flex-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || verificationCode.length !== 6}
                className="flex-1"
              >
                {isLoading ? 'Verifying...' : 'Verify & Enable'}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Two-Factor Authentication</h3>
          <p className="text-sm text-gray-600">
            Add an extra layer of security to your account
          </p>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <h4 className="font-medium text-yellow-800">🔒 Why Enable MFA?</h4>
          <ul className="text-sm text-yellow-700 mt-2 space-y-1">
            <li>• Protects against password breaches</li>
            <li>• Required for admin/host accounts</li>
            <li>• Industry security best practice</li>
            <li>• Free and easy to set up</li>
          </ul>
        </div>

        <Button 
          onClick={handleEnableMfa} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Setting up...' : 'Enable Two-Factor Authentication'}
        </Button>
      </div>
    </Card>
  );
}