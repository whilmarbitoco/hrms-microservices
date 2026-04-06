import { motion } from 'motion/react';
import { Activity, ArrowRight, Building2, CalendarDays, ShieldCheck, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDepartments } from '../../hooks/useDepartments';
import { useEmployees } from '../../hooks/useEmployees';
import { useLeaveRequests } from '../../hooks/useLeave';
import { useUsers } from '../../hooks/useUsers';
import { Button } from '../ui/Button';
import { ErrorState } from '../ui/ErrorState';
import { Loader } from '../ui/Loader';
import { ROLE_LABELS_BY_NAME } from '../../constants';

export default function AdminDashboard({ user }: { user: any }) {
  const navigate = useNavigate();
  const usersQuery = useUsers();
  const departmentsQuery = useDepartments();
  const employeesQuery = useEmployees();
  const leavesQuery = useLeaveRequests({ status: 'pending' });

  if (usersQuery.isLoading || departmentsQuery.isLoading || employeesQuery.isLoading || leavesQuery.isLoading) {
    return <Loader fullPage />;
  }

  if (usersQuery.isError || departmentsQuery.isError || employeesQuery.isError || leavesQuery.isError) {
    return (
      <ErrorState
        message="Failed to load the administrator overview."
        onRetry={() => {
          void usersQuery.refetch();
          void departmentsQuery.refetch();
          void employeesQuery.refetch();
          void leavesQuery.refetch();
        }}
      />
    );
  }

  const users = usersQuery.data ?? [];
  const departments = departmentsQuery.data ?? [];
  const employees = employeesQuery.data ?? [];
  const pendingLeaves = leavesQuery.data ?? [];
  const activeUsers = users.filter((item) => item.is_active);
  const roleBreakdown = users.reduce<Record<string, number>>((acc, item) => {
    const key = item.role ?? 'unassigned';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const stats = [
    { label: 'Active Users', value: activeUsers.length.toString(), icon: Users, color: 'bg-slate-900' },
    { label: 'Employees', value: employees.length.toString(), icon: Activity, color: 'bg-sky-600' },
    { label: 'Departments', value: departments.length.toString(), icon: Building2, color: 'bg-emerald-600' },
    { label: 'Pending Leaves', value: pendingLeaves.length.toString(), icon: CalendarDays, color: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Administrator Console</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">System access, workforce coverage, and role distribution</h1>
          <p className="max-w-2xl text-sm text-slate-600">
            Monitor account activity and structural data across the HRMS services.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/departments')}>
            <Building2 className="mr-2 h-4 w-4" />
            Departments
          </Button>
          <Button onClick={() => navigate('/users')}>
            <ShieldCheck className="mr-2 h-4 w-4" />
            Manage Users
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{stat.label}</p>
                <p className="mt-3 text-2xl font-bold text-slate-900">{stat.value}</p>
              </div>
              <div className={`${stat.color} rounded-2xl p-3 text-white`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-3xl border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Role coverage</h2>
              <p className="text-sm text-slate-500">How user access is currently distributed.</p>
            </div>
            <ShieldCheck className="h-5 w-5 text-slate-400" />
          </div>
          <div className="mt-6 space-y-3">
            {Object.entries(roleBreakdown).map(([role, count]) => (
              <div key={role} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <p className="font-medium text-slate-900">{ROLE_LABELS_BY_NAME[role] ?? role}</p>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{count}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Latest accounts</h2>
              <p className="text-sm text-slate-500">Recently created users and current status.</p>
            </div>
            <Button variant="ghost" onClick={() => navigate('/users')}>
              Open users
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <div className="mt-6 space-y-3">
            {[...users]
              .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
              .slice(0, 5)
              .map((account) => (
                <div key={account.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-slate-900">{account.name}</p>
                      <p className="text-sm text-slate-500">{account.email}</p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        account.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {account.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-500">
                    {account.role ? ROLE_LABELS_BY_NAME[account.role] ?? account.role : 'Role not assigned'}
                  </p>
                </div>
              ))}
          </div>
        </section>
      </div>
    </div>
  );
}
