import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { toast } from '../../components/ui/Toaster';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
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
      toast.success('Signed in successfully');
      navigate('/dashboard');
    } catch (error: any) {
      const errorMessage = error.message || (typeof error === 'string' ? error : 'Unable to sign in');
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Input
        label="Email address"
        type="email"
        placeholder="name@company.com"
        icon={<Mail className="h-4 w-4" />}
        {...register('email')}
        error={errors.email?.message}
      />

      <Input
        label="Password"
        type="password"
        placeholder="........"
        icon={<Lock className="h-4 w-4" />}
        {...register('password')}
        error={errors.password?.message}
      />

      <div className="flex justify-end">
        <Link to="/auth/forgot-password" className="text-sm font-medium text-accent-base hover:underline">
          Forgot password?
        </Link>
      </div>

      <Button type="submit" className="w-full" isLoading={isLoading}>
        Sign in
      </Button>

      <p className="text-center text-sm text-ink-muted">
        Don&apos;t have an account?{' '}
        <Link to="/auth/register" className="font-semibold text-accent-base hover:underline">
          Create one
        </Link>
      </p>
    </form>
  );
}
