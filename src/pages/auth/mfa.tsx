import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import { useAuthStore } from '@/lib/store/auth-store';
import { mfaTokenSchema } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

type MfaFormData = z.infer<typeof mfaTokenSchema>;

export function MfaPage() {
  const navigate = useNavigate();
  const { verifyMfa, user } = useAuthStore();
  const [isLoading, setIsLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MfaFormData>({
    resolver: zodResolver(mfaTokenSchema),
  });

  const onSubmit = async (data: MfaFormData) => {
    setIsLoading(true);
    try {
      await verifyMfa(data.token);
      toast.success('MFA verified successfully');
      navigate('/');
    } catch (error) {
      console.error('MFA verification error:', error);
      toast.error('Invalid MFA code');
    } finally {
      setIsLoading(false);
    }
  };

  // Redirect to login if no user
  if (!user) {
    navigate('/auth?type=login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Multi-Factor Authentication
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter the 6-digit code from your authenticator app
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="token" className="block text-sm font-medium text-gray-700">
                Authentication Code
              </label>
              <Input
                id="token"
                type="text"
                maxLength={6}
                placeholder="123456"
                {...register('token')}
                className="mt-1 text-center text-2xl font-mono tracking-widest"
                autoComplete="one-time-code"
              />
              {errors.token && (
                <p className="mt-1 text-sm text-red-600">{errors.token.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate('/auth?type=login')}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Back to Login
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}