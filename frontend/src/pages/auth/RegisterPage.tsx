import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { toast } from '../../components/ui/Toaster';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  employee_id: z.string().optional(),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      await api.post('/auth/register', data);
      toast.success('Registration successful! Please login.');
      navigate('/auth/login');
    } catch (error: any) {
      const errorMessage = error.message || (typeof error === 'string' ? error : 'Registration failed');
      toast.error(errorMessage);
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Input
        label="Full Name"
        placeholder="John Doe"
        {...register('name')}
        error={errors.name?.message}
      />

      <Input
        label="Email address"
        type="email"
        placeholder="user@hrms.com"
        {...register('email')}
        error={errors.email?.message}
      />

      <Input
        label="Employee ID (Optional)"
        placeholder="EMP001"
        {...register('employee_id')}
        error={errors.employee_id?.message}
      />

      <Input
        label="Password"
        type="password"
        placeholder="••••••••"
        {...register('password')}
        error={errors.password?.message}
      />

      <Button type="submit" className="w-full" isLoading={isLoading}>
        Create Account
      </Button>

      <p className="text-center text-sm text-slate-600">
        Already have an account?{' '}
        <Link to="/auth/login" className="font-medium text-indigo-600 hover:text-indigo-500">
          Sign in
        </Link>
      </p>
    </form>
  );
}
