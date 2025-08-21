import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/store/auth-store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const { verifyEmail } = useAuthStore();
  const [isLoading, setIsLoading] = React.useState(true);
  const [isVerified, setIsVerified] = React.useState(false);

  React.useEffect(() => {
    if (!token) {
      toast.error('Invalid or missing verification token');
      navigate('/auth?type=login');
      return;
    }

    const verifyToken = async () => {
      try {
        await verifyEmail(token);
        setIsVerified(true);
        toast.success('Email verified successfully');
      } catch (error) {
        console.error('Email verification error:', error);
        toast.error('Failed to verify email');
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, [token, verifyEmail, navigate]);

  if (!token) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Email Verification
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            {isLoading ? (
              <p className="text-gray-600">Verifying your email...</p>
            ) : isVerified ? (
              <>
                <p className="text-green-600 mb-4">Your email has been verified!</p>
                <Button
                  onClick={() => navigate('/auth?type=login')}
                  className="w-full"
                >
                  Continue to Login
                </Button>
              </>
            ) : (
              <>
                <p className="text-red-600 mb-4">Failed to verify your email.</p>
                <Button
                  onClick={() => navigate('/auth?type=login')}
                  className="w-full"
                >
                  Back to Login
                </Button>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
