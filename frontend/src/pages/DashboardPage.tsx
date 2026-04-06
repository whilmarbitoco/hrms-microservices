import { useAuth } from '../context/AuthContext';
import AdminDashboard from '../components/dashboard/AdminDashboard';
import HRDashboard from '../components/dashboard/HRDashboard';
import EmployeeDashboard from '../components/dashboard/EmployeeDashboard';
import { Loader } from '../components/ui/Loader';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <Loader fullPage />;

  if (!user?.role) {
    return (
      <div className="hero-banner">
        <div className="hero-content min-h-[320px] items-center">
          <div className="max-w-2xl">
            <p className="hero-kicker">Account setup pending</p>
            <h1 className="hero-title">Your workspace is not available yet.</h1>
            <p className="hero-text">
              Your account exists, but no usable role has been assigned. An administrator needs to
              complete your HRMS access before dashboards and modules can be loaded.
            </p>
          </div>
          <div className="rounded-2xl border border-border-base bg-paper-raised/90 p-6 shadow-sm">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-muted">
              Current state
            </div>
            <div className="mt-3 text-2xl font-bold tracking-tight text-ink-base">Role not assigned</div>
            <p className="mt-2 max-w-xs text-sm leading-7 text-ink-muted">
              Contact your HR or system administrator to finish your account configuration.
            </p>
          </div>
        </div>
      </div>
    );
  }

  switch (user.role) {
    case 'admin':
      return <AdminDashboard user={user} />;
    case 'hr_manager':
      return <HRDashboard user={user} />;
    case 'employee':
    default:
      return <EmployeeDashboard user={user} />;
  }
}
