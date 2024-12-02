import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthForm } from '@/components/auth/auth-form';

export function AuthPage() {
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') as 'login' | 'register' || 'login';
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {type === 'login' ? 'Sign in to your account' : 'Create a new account'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {type === 'login' ? (
            <>
              Don't have an account?{' '}
              <button
                onClick={() => navigate('/auth?type=register')}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                onClick={() => navigate('/auth?type=login')}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <AuthForm type={type} />
        </div>
      </div>
    </div>
  );
}