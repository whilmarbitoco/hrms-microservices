import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { toast } from '../../components/ui/Toaster';
import { api } from '../../lib/api';

const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email address'),
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
      toast.success('Reset instructions generated for this account');
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
      <div className="space-y-6">
        <div className="rounded-2xl border border-success-base/20 bg-success-base/10 px-5 py-5 text-sm leading-7 text-ink-muted">
          If an account exists for that email address, reset instructions have been generated. For
          local testing, the token is also printed to the console.
        </div>
        <Link to="/auth/login" className="inline-flex items-center gap-2 text-sm font-medium text-accent-base hover:underline">
          Back to sign in
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-ink-base">Forgot your password?</h2>
        <p className="text-sm leading-7 text-ink-muted">
          Enter your work email and we&apos;ll generate reset instructions for your account.
        </p>
      </div>

      <Input
        label="Email address"
        type="email"
        placeholder="name@company.com"
        icon={<Mail className="h-4 w-4" />}
        {...register('email')}
        error={errors.email?.message}
      />

      <Button type="submit" className="w-full" isLoading={isLoading}>
        Send reset instructions
      </Button>

      <div className="rounded-2xl border border-border-base bg-paper-sunken/30 px-4 py-4 text-sm text-ink-muted">
        Remembered your password?{' '}
        <Link to="/auth/login" className="font-semibold text-accent-base hover:underline">
          Sign in
        </Link>
      </div>
    </form>
  );
}
