import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { useAuthStore } from '@/lib/store/auth-store';
import { loginSchema, registerSchema } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function AuthForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, register } = useAuthStore();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  type Role = 'guest' | 'host';
  const [formData, setFormData] = React.useState<{
    email: string;
    password: string;
    name: string;
    confirmPassword: string;
    role: Role;
  }>({
    email: '',
    password: '',
    name: '',
    confirmPassword: '',
    role: 'guest',
  });

  const defaultTab = searchParams.get('type') || 'login';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(''); // Clear error when user types
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError('');
      const validatedData = loginSchema.parse(formData);
      const response = await login(validatedData);
      
      if (response.requireMfa) {
        toast.info('Please complete MFA verification');
        navigate('/auth/mfa');
        return;
      }

      toast.success('Logged in successfully');
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors[0]?.message || 'Invalid email or password format';
        setError(errorMessage);
        toast.error(errorMessage);
      } else if (error instanceof Error) {
        // 🔧 IMPROVED: Better error message handling
        const message = error.message || 'Login failed. Please try again.';
        setError(message);
        toast.error(message);
      } else {
        setError('Login failed. Please try again.');
        toast.error('Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError('');
      
      const validatedData = registerSchema.parse(formData);
      
      await register({
        name: validatedData.name,
        email: validatedData.email,
        password: validatedData.password,
        role: validatedData.role,
      });
      
      toast.success('Registration successful! You are now logged in.');
      navigate('/');
    } catch (error) {
      console.error('Registration error:', error);
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors[0]?.message || 'Invalid registration data';
        setError(errorMessage);
        toast.error(errorMessage);
      } else {
        setError('Registration failed. Please try again.');
        toast.error('Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = (value: Role) => {
    setFormData((prev) => ({ ...prev, role: value }));
  };

  return (
    <Card className="p-6">
      <Tabs defaultValue={defaultTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="register">Register</TabsTrigger>
        </TabsList>

        <TabsContent value="login">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                {error}
              </div>
            )}

            <div>
              <Input
                name="email"
                type="email"
                placeholder="Email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="mt-1"
              />
            </div>

            <div>
              <Input
                name="password"
                type="password"
                placeholder="Password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="mt-1"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>

            <div className="text-center">
              <Link
                to="/auth/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Forgot your password?
              </Link>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="register">
          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                {error}
              </div>
            )}

            <div>
              <Input
                name="name"
                type="text"
                placeholder="Full Name"
                autoComplete="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="mt-1"
              />
            </div>

            <div>
              <Input
                name="email"
                type="email"
                placeholder="Email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="mt-1"
              />
            </div>

            <div>
              <Input
                name="password"
                type="password"
                placeholder="Password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="mt-1"
              />
            </div>

            <div>
              <Input
                name="confirmPassword"
                type="password"
                placeholder="Confirm Password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="mt-1"
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Account Type
              </label>
              <Select
                value={formData.role}
                onValueChange={handleRoleChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="guest">Guest</SelectItem>
                  <SelectItem value="host">Host</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Registering...' : 'Register'}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </Card>
  );
}