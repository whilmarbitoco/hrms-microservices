import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { toast } from '../../components/ui/Toaster';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', data);
      login(response.data.access_token, response.data.user);
      toast.success('Logged in successfully');
      navigate('/dashboard');
    } catch (error: any) {
      const errorMessage = error.message || (typeof error === 'string' ? error : 'An unexpected error occurred');
      toast.error(errorMessage);
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Input
        label="Email address"
        type="email"
        placeholder="user@hrms.com"
        {...register('email')}
        error={errors.email?.message}
      />

      <Input
        label="Password"
        type="password"
        placeholder="••••••••"
        {...register('password')}
        error={errors.password?.message}
      />

      <div className="flex items-center justify-between">
        <div className="text-sm">
          <Link to="/auth/forgot-password" title="Forgot password" className="font-medium text-indigo-600 hover:text-indigo-500">
            Forgot your password?
          </Link>
        </div>
      </div>

      <Button type="submit" className="w-full" isLoading={isLoading}>
        Sign in
      </Button>

      <p className="text-center text-sm text-slate-600">
        Don't have an account?{' '}
        <Link to="/auth/register" className="font-medium text-indigo-600 hover:text-indigo-500">
          Register here
        </Link>
      </p>
    </form>
  );
}
