import { useAuth } from '../context/AuthContext';
import AdminDashboard from '../components/dashboard/AdminDashboard';
import HRDashboard from '../components/dashboard/HRDashboard';
import PayrollDashboard from '../components/dashboard/PayrollDashboard';
import EmployeeDashboard from '../components/dashboard/EmployeeDashboard';
import { Loader } from '../components/ui/Loader';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <Loader fullPage />;

  if (!user?.role) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center">
          <span className="text-2xl">👤</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900">Role not assigned</h2>
        <p className="text-slate-500 max-w-md">
          Your account has been created, but a system administrator hasn't assigned you a role yet. 
          Please contact your HR department or system admin.
        </p>
      </div>
    );
  }

  // Role-based rendering
  switch (user.role) {
    case 'admin':
      return <AdminDashboard user={user} />;
    case 'hr_manager':
      return <HRDashboard user={user} />;
    case 'payroll_officer':
      return <PayrollDashboard user={user} />;
    case 'employee':
    default:
      return <EmployeeDashboard user={user} />;
  }
}
