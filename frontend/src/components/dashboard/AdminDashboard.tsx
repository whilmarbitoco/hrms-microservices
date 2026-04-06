import { motion } from 'motion/react';
import { ArrowUpRight, Building2, CalendarDays, ShieldCheck, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROLE_LABELS_BY_NAME } from '../../constants';
import { useDepartments } from '../../hooks/useDepartments';
import { useEmployees } from '../../hooks/useEmployees';
import { useLeaveRequests } from '../../hooks/useLeave';
import { useUsers } from '../../hooks/useUsers';
import { Button } from '../ui/Button';
import { ErrorState } from '../ui/ErrorState';
import { Loader } from '../ui/Loader';

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
        title="Unable to load executive overview"
        message="Some organization data could not be synchronized. Retry the request to refresh the dashboard."
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
    {
      label: 'Active accounts',
      value: activeUsers.length.toString(),
      meta: 'Users with current access',
      icon: Users,
    },
    {
      label: 'Employees',
      value: employees.length.toString(),
      meta: 'People records across the company',
      icon: ShieldCheck,
    },
    {
      label: 'Departments',
      value: departments.length.toString(),
      meta: 'Configured business units',
      icon: Building2,
    },
    {
      label: 'Pending leave approvals',
      value: pendingLeaves.length.toString(),
      meta: 'Requests waiting for action',
      icon: CalendarDays,
    },
  ];

  const recentAccounts = [...users]
    .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
    .slice(0, 5);

  return (
    <div className="page-shell">
      <section className="hero-banner">
        <div className="hero-content">
          <div>
            <p className="hero-kicker">Organization overview</p>
            <h1 className="hero-title">Administrative command center</h1>
            <p className="hero-text">
              Monitor platform adoption, workforce structure, and access governance from one
              concise executive view.
            </p>
            <div className="hero-meta">
              <span className="hero-meta-chip">Signed in as {user?.name}</span>
              <span className="hero-meta-chip">Role: Administrator</span>
            </div>
          </div>
          <Button onClick={() => navigate('/users')}>
            Open user directory
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      <section className="metric-grid">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className="metric-card"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="metric-label">{stat.label}</p>
                <p className="metric-value">{stat.value}</p>
                <p className="metric-meta">{stat.meta}</p>
              </div>
              <div className="rounded-2xl border border-border-base bg-paper-sunken p-3">
                <stat.icon className="h-5 w-5 text-accent-base" />
              </div>
            </div>
          </motion.div>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <section className="section-card">
          <div className="section-header">
            <div>
              <h2 className="section-title">Access distribution</h2>
              <p className="section-description">Current user mix by assigned platform role.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/users')}>
              Manage users
            </Button>
          </div>

          <div className="space-y-3">
            {Object.entries(roleBreakdown).map(([role, count]) => (
              <div
                key={role}
                className="flex items-center justify-between rounded-xl border border-border-base bg-paper-sunken/30 px-4 py-4"
              >
                <div>
                  <p className="text-sm font-semibold text-ink-base">
                    {ROLE_LABELS_BY_NAME[role] ?? role.replace('_', ' ')}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-ink-muted">
                    Active role bucket
                  </p>
                </div>
                <div className="text-2xl font-bold tracking-tight text-ink-base">{count}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="section-card">
          <div className="section-header">
            <div>
              <h2 className="section-title">Recently added accounts</h2>
              <p className="section-description">Newest users created in the platform.</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/users')}>
              View all
            </Button>
          </div>

          <div className="data-list">
            {recentAccounts.map((account) => (
              <div key={account.id} className="data-list-row">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <p className="truncate text-sm font-semibold text-ink-base">{account.name}</p>
                    <span
                      className={
                        account.is_active
                          ? 'status-badge status-badge-success'
                          : 'status-badge status-badge-danger'
                      }
                    >
                      {account.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm text-ink-muted">{account.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-ink-base">
                    {account.role ? ROLE_LABELS_BY_NAME[account.role] ?? account.role : 'Unassigned'}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-ink-muted">
                    {new Date(account.created_at ?? '').toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
