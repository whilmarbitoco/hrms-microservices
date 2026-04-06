import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { BadgeCheck, Lock, Mail, User } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { toast } from '../../components/ui/Toaster';
import { api } from '../../lib/api';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
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
      toast.success('Registration successful. Please sign in.');
      navigate('/auth/login');
    } catch (error: any) {
      const errorMessage = error.message || (typeof error === 'string' ? error : 'Registration failed');
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Input
        label="Full name"
        placeholder="John Doe"
        icon={<User className="h-4 w-4" />}
        {...register('name')}
        error={errors.name?.message}
      />

      <Input
        label="Email address"
        type="email"
        placeholder="name@company.com"
        icon={<Mail className="h-4 w-4" />}
        {...register('email')}
        error={errors.email?.message}
      />

      <Input
        label="Employee ID"
        placeholder="Optional"
        icon={<BadgeCheck className="h-4 w-4" />}
        {...register('employee_id')}
        error={errors.employee_id?.message}
      />

      <Input
        label="Password"
        type="password"
        placeholder="........"
        icon={<Lock className="h-4 w-4" />}
        {...register('password')}
        error={errors.password?.message}
      />

      <Button type="submit" className="w-full" isLoading={isLoading}>
        Create account
      </Button>

      <p className="text-center text-sm text-ink-muted">
        Already have an account?{' '}
        <Link to="/auth/login" className="font-semibold text-accent-base hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
