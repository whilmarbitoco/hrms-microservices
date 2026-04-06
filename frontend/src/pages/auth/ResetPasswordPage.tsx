import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, KeyRound, Lock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { toast } from '../../components/ui/Toaster';
import { api } from '../../lib/api';

const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    new_password: z.string().min(6, 'Password must be at least 6 characters'),
    confirm_password: z.string().min(6, 'Please confirm your password'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords don't match",
    path: ['confirm_password'],
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
      toast.success('Password reset successfully. Please sign in.');
      navigate('/auth/login');
    } catch (error: any) {
      toast.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-ink-base">Reset password</h2>
        <p className="text-sm leading-7 text-ink-muted">
          Enter your reset token and create a new password for your HRMS account.
        </p>
      </div>

      <div className="space-y-5">
        <Input
          label="Reset token"
          placeholder="Enter the token from your email"
          icon={<KeyRound className="h-4 w-4" />}
          {...register('token')}
          error={errors.token?.message}
        />

        <Input
          label="New password"
          type="password"
          placeholder="........"
          icon={<Lock className="h-4 w-4" />}
          {...register('new_password')}
          error={errors.new_password?.message}
        />

        <Input
          label="Confirm new password"
          type="password"
          placeholder="........"
          icon={<Lock className="h-4 w-4" />}
          {...register('confirm_password')}
          error={errors.confirm_password?.message}
        />
      </div>

      <Button type="submit" className="w-full" isLoading={isLoading}>
        Reset password
        <ArrowRight className="h-4 w-4" />
      </Button>
    </form>
  );
}
