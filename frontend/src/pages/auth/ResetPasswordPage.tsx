import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { toast } from '../../components/ui/Toaster';

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  new_password: z.string().min(6, 'Password must be at least 6 characters'),
  confirm_password: z.string().min(6, 'Please confirm your password'),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: searchParams.get('token') || '',
    },
  });

  const onSubmit = async (data: ResetPasswordForm) => {
    setIsLoading(true);
    try {
      await api.post('/auth/reset-password', {
        token: data.token,
        new_password: data.new_password,
      });
      toast.success('Password reset successfully! Please login.');
      navigate('/auth/login');
    } catch (error: any) {
      toast.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Input
        label="Reset Token"
        placeholder="Enter the token from your email"
        {...register('token')}
        error={errors.token?.message}
      />

      <Input
        label="New Password"
        type="password"
        placeholder="••••••••"
        {...register('new_password')}
        error={errors.new_password?.message}
      />

      <Input
        label="Confirm New Password"
        type="password"
        placeholder="••••••••"
        {...register('confirm_password')}
        error={errors.confirm_password?.message}
      />

      <Button type="submit" className="w-full" isLoading={isLoading}>
        Reset Password
      </Button>
    </form>
  );
}
