import React from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/store/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { mfaTokenSchema } from '@/lib/validations/auth';

export function MFASetup() {
  const { user, enableMfa, verifyMfaSetup } = useAuthStore();
  const [qrCode, setQrCode] = React.useState<string>('');
  const [token, setToken] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [step, setStep] = React.useState<'setup' | 'verify'>('setup');

  const handleEnableMfa = async () => {
    try {
      setIsLoading(true);
      const { qrCodeUrl } = await enableMfa();
      setQrCode(qrCodeUrl);
      setStep('verify');
      toast.success('MFA enabled successfully. Please verify your device.');
    } catch (error) {
      toast.error('Failed to enable MFA');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyToken = async () => {
    try {
      const validatedToken = mfaTokenSchema.parse({ token });
      setIsLoading(true);
      await verifyMfaSetup(validatedToken.token);
      toast.success('MFA verified successfully');
    } catch (error) {
      toast.error('Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6 max-w-md mx-auto">
      <div className="space-y-6">
        {step === 'setup' ? (
          <>
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Enable Two-Factor Authentication</h2>
              <p className="text-gray-600">
                Enhance your account security by enabling two-factor authentication using Google Authenticator.
              </p>
            </div>
            <Button
              onClick={handleEnableMfa}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Setting up...' : 'Set up MFA'}
            </Button>
          </>
        ) : (
          <>
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Verify Your Device</h2>
              <p className="text-gray-600 mb-4">
                Scan the QR code below with your authenticator app and enter the verification code.
              </p>
            </div>
            {qrCode && (
              <div className="flex justify-center mb-6">
                <img src={qrCode} alt="QR Code" className="w-48 h-48" />
              </div>
            )}
            <div className="space-y-4">
              <Input
                type="text"
                placeholder="Enter 6-digit code"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                maxLength={6}
                className="text-center text-2xl tracking-wide"
              />
              <Button
                onClick={handleVerifyToken}
                disabled={isLoading || token.length !== 6}
                className="w-full"
              >
                {isLoading ? 'Verifying...' : 'Verify Code'}
              </Button>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
