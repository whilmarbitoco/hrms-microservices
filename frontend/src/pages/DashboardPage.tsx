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
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
          <span className="text-2xl">👤</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900">Role not assigned</h2>
        <p className="max-w-md text-slate-500">
          Your account exists, but it does not have a usable role yet. Contact an administrator to
          finish the setup.
        </p>
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
