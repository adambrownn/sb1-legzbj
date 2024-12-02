import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { loginSchema, registerSchema } from '@/lib/validations/auth';
import { useAuthStore } from '@/lib/store/auth-store';
import { useNotificationStore } from '@/lib/store/notification-store';

interface AuthFormProps {
  type: 'login' | 'register';
}

export function AuthForm({ type }: AuthFormProps) {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { addNotification } = useNotificationStore();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(type === 'login' ? loginSchema : registerSchema),
  });

  const onSubmit = async (data: any) => {
    try {
      // In a real app, this would make an API call
      if (type === 'login') {
        const user = {
          id: crypto.randomUUID(),
          email: data.email,
          name: data.email.split('@')[0],
          role: 'guest' as const,
        };
        
        login(user);
        
        addNotification({
          title: 'Welcome back!',
          message: 'You have successfully logged in.',
          type: 'success',
          userId: user.id,
        });

        toast.success('Logged in successfully');
        navigate('/');
      } else {
        const user = {
          id: crypto.randomUUID(),
          email: data.email,
          name: data.name,
          role: data.role,
        };

        login(user);

        addNotification({
          title: 'Welcome to Rovers Suites!',
          message: 'Your account has been created successfully.',
          type: 'success',
          userId: user.id,
        });

        toast.success('Account created successfully');
        navigate(data.role === 'host' ? '/host/properties' : '/');
      }
    } catch (error) {
      toast.error('Authentication failed');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {type === 'register' && (
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            {...register('name')}
            type="text"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message as string}</p>
          )}
        </div>
      )}
      
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          {...register('email')}
          type="email"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message as string}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          {...register('password')}
          type="password"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password.message as string}</p>
        )}
      </div>

      {type === 'register' && (
        <>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <input
              {...register('confirmPassword')}
              type="password"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message as string}</p>
            )}
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
              I want to
            </label>
            <select
              {...register('role')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="guest">Book places to stay</option>
              <option value="host">Host my property</option>
            </select>
          </div>
        </>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Please wait...' : type === 'login' ? 'Sign In' : 'Create Account'}
      </Button>
    </form>
  );
}