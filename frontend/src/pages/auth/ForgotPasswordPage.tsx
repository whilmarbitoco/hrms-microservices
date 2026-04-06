import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { toast } from '../../components/ui/Toaster';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', data);
      toast.success('Reset token generated (Check console for testing)');
      console.log('Reset Token:', response.data.reset_token);
      setIsSubmitted(true);
    } catch (error: any) {
      toast.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="text-center space-y-4">
        <div className="bg-green-50 text-green-800 p-4 rounded-lg border border-green-200">
          If an account exists for that email, we've sent instructions to reset your password.
        </div>
        <Link to="/auth/login" className="block text-sm font-medium text-indigo-600 hover:text-indigo-500">
          Back to Login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <p className="text-sm text-slate-600">
        Enter your email address and we'll send you a link to reset your password.
      </p>
      
      <Input
        label="Email address"
        type="email"
        placeholder="user@hrms.com"
        {...register('email')}
        error={errors.email?.message}
      />

      <Button type="submit" className="w-full" isLoading={isLoading}>
        Send Reset Link
      </Button>

      <p className="text-center text-sm text-slate-600">
        Remembered your password?{' '}
        <Link to="/auth/login" className="font-medium text-indigo-600 hover:text-indigo-500">
          Sign in
        </Link>
      </p>
    </form>
  );
}
