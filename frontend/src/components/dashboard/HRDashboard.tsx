import { motion } from 'motion/react';
import { ArrowRight, BriefcaseBusiness, Building2, CalendarDays, UserPlus, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDepartments } from '../../hooks/useDepartments';
import { useEmployeeRoles } from '../../hooks/useEmployeeRoles';
import { useEmployees } from '../../hooks/useEmployees';
import { useLeaveRequests } from '../../hooks/useLeave';
import { formatDate } from '../../lib/utils';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';
import { Loader } from '../ui/Loader';

export default function HRDashboard({ user }: { user: any }) {
  const navigate = useNavigate();
  const employeesQuery = useEmployees();
  const departmentsQuery = useDepartments();
  const rolesQuery = useEmployeeRoles();
  const leavesQuery = useLeaveRequests({ status: 'pending' });

  if (employeesQuery.isLoading || departmentsQuery.isLoading || rolesQuery.isPending || leavesQuery.isLoading) {
    return <Loader fullPage />;
  }

  if (employeesQuery.isError || departmentsQuery.isError || rolesQuery.isError || leavesQuery.isError) {
    return (
      <ErrorState
        title="Unable to load HR overview"
        message="Workforce operations data could not be synchronized. Retry to refresh headcount, roles, and leave requests."
        onRetry={() => {
          void employeesQuery.refetch();
          void departmentsQuery.refetch();
          void rolesQuery.refetch();
          void leavesQuery.refetch();
        }}
      />
    );
  }

  const employees = employeesQuery.data ?? [];
  const departments = departmentsQuery.data ?? [];
  const roles = rolesQuery.data ?? [];
  const pendingLeaves = leavesQuery.data ?? [];
  const activeEmployees = employees.filter((employee) => employee.status === 'active');
  const recentHires = [...activeEmployees]
    .filter((employee) => employee.hired_at)
    .sort((a, b) => new Date(b.hired_at ?? 0).getTime() - new Date(a.hired_at ?? 0).getTime())
    .slice(0, 4);

  const stats = [
    { label: 'Active headcount', value: activeEmployees.length.toString(), meta: 'Employees currently active', icon: Users },
    { label: 'Departments', value: departments.length.toString(), meta: 'Business units configured', icon: Building2 },
    { label: 'Pending leave requests', value: pendingLeaves.length.toString(), meta: 'Requests waiting for review', icon: CalendarDays },
    { label: 'Role profiles', value: roles.length.toString(), meta: 'Defined employee role records', icon: BriefcaseBusiness },
  ];

  return (
    <div className="page-shell">
      <section className="hero-banner">
        <div className="hero-content">
          <div>
            <p className="hero-kicker">People operations</p>
            <h1 className="hero-title">Human resources workspace</h1>
            <p className="hero-text">
              Review pending leave activity, track new hires, and move between the core workforce
              management modules from one clean operational view.
            </p>
            <div className="hero-meta">
              <span className="hero-meta-chip">Signed in as {user?.name}</span>
              <span className="hero-meta-chip">Role: HR manager</span>
            </div>
          </div>
          <Button onClick={() => navigate('/employees')}>
            Open employee directory
            <ArrowRight className="h-4 w-4" />
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

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="section-card">
          <div className="section-header">
            <div>
              <h2 className="section-title">Pending leave queue</h2>
              <p className="section-description">Requests that need review by HR or approvers.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/leave')}>
              Open leave management
            </Button>
          </div>

          {pendingLeaves.length === 0 ? (
            <EmptyState
              title="No pending leave requests"
              description="The approval queue is clear right now."
              icon={CalendarDays}
            />
          ) : (
            <div className="data-list">
              {pendingLeaves.slice(0, 4).map((request) => (
                <div key={request.id} className="data-list-row">
                  <div>
                    <p className="text-sm font-semibold text-ink-base">
                      Employee #{request.employee_id}
                    </p>
                    <p className="mt-1 text-sm text-ink-muted">
                      {request.policy?.name ?? 'General leave'} for {request.days} day(s)
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.16em] text-ink-muted">
                      {formatDate(request.start_date)} to {formatDate(request.end_date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="status-badge status-badge-warning">Pending</span>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/leave')}>
                      Review
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="space-y-6">
          <section className="section-card">
            <div className="section-header">
              <div>
                <h2 className="section-title">Recent hires</h2>
                <p className="section-description">Newest active employees added to the company.</p>
              </div>
            </div>

            {recentHires.length === 0 ? (
              <EmptyState
                title="No recent hires"
                description="Newly onboarded employees will appear here."
                icon={UserPlus}
              />
            ) : (
              <div className="space-y-3">
                {recentHires.map((employee) => (
                  <div
                    key={employee.id}
                    className="rounded-xl border border-border-base bg-paper-sunken/25 px-4 py-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-ink-base">{employee.name}</p>
                        <p className="mt-1 text-sm text-ink-muted">
                          {employee.department?.name ?? 'No department'} . {employee.role?.name ?? 'No role'}
                        </p>
                      </div>
                      <span className="status-badge status-badge-neutral">
                        {employee.hired_at ? formatDate(employee.hired_at) : 'Recent'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="section-card">
            <div className="section-header">
              <div>
                <h2 className="section-title">Quick access</h2>
                <p className="section-description">Jump directly to the core HR workspaces.</p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Employees', description: 'Manage the workforce directory', path: '/employees' },
                { label: 'Departments', description: 'Review organizational units', path: '/departments' },
                { label: 'Employee roles', description: 'Maintain role definitions', path: '/employee-roles' },
              ].map((link) => (
                <button
                  key={link.path}
                  type="button"
                  onClick={() => navigate(link.path)}
                  className="flex w-full items-center justify-between rounded-xl border border-border-base bg-paper-raised px-4 py-4 text-left transition-all hover:bg-paper-sunken"
                >
                  <div>
                    <p className="text-sm font-semibold text-ink-base">{link.label}</p>
                    <p className="mt-1 text-sm text-ink-muted">{link.description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-ink-muted" />
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
