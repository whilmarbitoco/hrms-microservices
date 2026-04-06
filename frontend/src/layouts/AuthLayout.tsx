import { Link, Outlet, useLocation } from 'react-router-dom';

const TITLES: Record<string, { title: string; description: string }> = {
  '/auth/login': {
    title: 'Sign in',
    description: 'Access your HRMS workspace with your company credentials.',
  },
  '/auth/register': {
    title: 'Create account',
    description: 'Set up a new HRMS account to access the platform.',
  },
  '/auth/forgot-password': {
    title: 'Forgot password',
    description: 'Request a password reset for your HRMS account.',
  },
  '/auth/reset-password': {
    title: 'Reset password',
    description: 'Enter your reset token and choose a new password.',
  },
};

export default function AuthLayout() {
  const location = useLocation();
  const content = TITLES[location.pathname] ?? TITLES['/auth/login'];

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper-base px-6 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border-base bg-paper-raised p-8 shadow-lg">
        <Link to="/" className="inline-flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-base text-xl font-bold text-white">
            H
          </div>
          <div>
            <p className="text-lg font-bold tracking-tight text-ink-base">HRMS</p>
            <p className="text-xs uppercase tracking-[0.16em] text-ink-muted">Workforce system</p>
          </div>
        </Link>

        <div className="mt-8 space-y-2 border-b border-border-faint pb-6">
          <h1 className="text-2xl font-bold tracking-tight text-ink-base">{content.title}</h1>
          <p className="text-sm leading-7 text-ink-muted">{content.description}</p>
        </div>

        <div className="pt-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
