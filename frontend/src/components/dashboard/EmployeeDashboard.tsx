import { motion } from 'motion/react';
import { CalendarDays, CircleAlert, Clock3, ShieldCheck, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLeaveBalances, useLeaveRequests } from '../../hooks/useLeave';
import { useEmployeePayslips } from '../../hooks/usePayroll';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';
import { Loader } from '../ui/Loader';

export default function EmployeeDashboard({ user }: { user: any }) {
  const navigate = useNavigate();
  const employeeId = user?.employee_id;

  const balancesQuery = useLeaveBalances(employeeId);
  const requestsQuery = useLeaveRequests(
    {
      employee_id: employeeId,
    },
    Boolean(employeeId)
  );
  const payslipsQuery = useEmployeePayslips(employeeId, Boolean(employeeId));

  if (!employeeId) {
    return (
      <div className="hero-banner">
        <div className="hero-content min-h-[280px] items-center">
          <div className="max-w-2xl">
            <p className="hero-kicker">Profile setup required</p>
            <h1 className="hero-title">Your employee record is not linked yet.</h1>
            <p className="hero-text">
              Self-service leave and payroll data depend on a linked employee profile. Contact HR to
              connect your account before using the portal.
            </p>
          </div>
          <div className="rounded-2xl border border-error-base/20 bg-error-base/5 p-6 shadow-sm">
            <CircleAlert className="h-8 w-8 text-error-base" />
            <p className="mt-3 text-lg font-semibold text-ink-base">Profile not linked</p>
          </div>
        </div>
      </div>
    );
  }

  if (balancesQuery.isLoading || requestsQuery.isLoading || payslipsQuery.isLoading) {
    return <Loader fullPage />;
  }

  if (balancesQuery.isError || requestsQuery.isError || payslipsQuery.isError) {
    return (
      <ErrorState
        title="Unable to load personal workspace"
        message="Your leave balances or payroll data could not be synchronized. Retry to refresh your dashboard."
        onRetry={() => {
          void balancesQuery.refetch();
          void requestsQuery.refetch();
          void payslipsQuery.refetch();
        }}
      />
    );
  }

  const balances = balancesQuery.data ?? [];
  const requests = [...(requestsQuery.data ?? [])].sort(
    (a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
  );
  const payslips = [...(payslipsQuery.data ?? [])].sort(
    (a, b) => new Date(b.generated_at ?? 0).getTime() - new Date(a.generated_at ?? 0).getTime()
  );

  const totalBalance = balances.reduce((sum, item) => sum + Number(item.balance), 0);
  const pendingRequests = requests.filter((item) => item.status === 'pending').length;
  const approvedRequests = requests.filter((item) => item.status === 'approved').length;
  const latestPayslip = payslips[0];

  const stats = [
    { label: 'Available leave days', value: totalBalance.toFixed(1), meta: 'Combined leave balance', icon: CalendarDays },
    { label: 'Pending requests', value: pendingRequests.toString(), meta: 'Awaiting manager review', icon: Clock3 },
    { label: 'Approved requests', value: approvedRequests.toString(), meta: 'Approved leave entries', icon: ShieldCheck },
    {
      label: 'Latest net pay',
      value: latestPayslip ? formatCurrency(latestPayslip.net) : 'No record',
      meta: 'Most recent generated payslip',
      icon: Wallet,
    },
  ];

  return (
    <div className="page-shell">
      <section className="hero-banner">
        <div className="hero-content">
          <div>
            <p className="hero-kicker">Self service</p>
            <h1 className="hero-title">Employee workspace</h1>
            <p className="hero-text">
              Review leave balances, track requests, and check payroll activity from a single
              professional self-service dashboard.
            </p>
            <div className="hero-meta">
              <span className="hero-meta-chip">Signed in as {user?.name}</span>
              <span className="hero-meta-chip">Employee ID: {employeeId}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => navigate('/leave')}>
              Request leave
            </Button>
            <Button onClick={() => navigate('/payroll')}>View payroll</Button>
          </div>
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

      <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
        <section className="section-card">
          <div className="section-header">
            <div>
              <h2 className="section-title">Leave balances</h2>
              <p className="section-description">Available balances by policy.</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/leave')}>
              Manage leave
            </Button>
          </div>

          {balances.length === 0 ? (
            <EmptyState
              title="No leave balances assigned"
              description="Your leave policies will appear here once HR allocates them."
              icon={CalendarDays}
            />
          ) : (
            <div className="space-y-3">
              {balances.map((balance) => (
                <div
                  key={balance.id}
                  className="flex items-center justify-between rounded-xl border border-border-base bg-paper-sunken/25 px-4 py-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-ink-base">
                      {balance.policy?.name ?? 'Leave policy'}
                    </p>
                    <p className="mt-1 text-sm text-ink-muted">
                      {balance.policy?.type ?? 'Standard policy'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold tracking-tight text-ink-base">
                      {Number(balance.balance).toFixed(1)}
                    </p>
                    <p className="text-xs uppercase tracking-[0.16em] text-ink-muted">days</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="section-card">
          <div className="section-header">
            <div>
              <h2 className="section-title">Recent payslips</h2>
              <p className="section-description">Your latest payroll records and net pay totals.</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/payroll')}>
              Full history
            </Button>
          </div>

          {payslips.length === 0 ? (
            <EmptyState
              title="No payslips generated yet"
              description="Payroll records will appear here after your first processed cycle."
              icon={Wallet}
            />
          ) : (
            <div className="space-y-3">
              {payslips.slice(0, 3).map((payslip) => (
                <div key={payslip.id} className="rounded-xl border border-border-base bg-paper-sunken/25 px-4 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-ink-base">Batch #{payslip.batch_id}</p>
                      <p className="mt-1 text-sm text-ink-muted">
                        Generated {payslip.generated_at ? formatDate(payslip.generated_at) : 'Pending'}
                      </p>
                    </div>
                    <span className="status-badge status-badge-neutral">{payslip.status}</span>
                  </div>
                  <div className="mt-4 border-t border-border-faint pt-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-ink-muted">Net pay</p>
                    <p className="mt-1 text-2xl font-bold tracking-tight text-accent-base">
                      {formatCurrency(payslip.net)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="section-card">
        <div className="section-header">
          <div>
            <h2 className="section-title">Recent leave requests</h2>
            <p className="section-description">Latest leave applications and their approval status.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/leave')}>
            Open leave center
          </Button>
        </div>

        {requests.length === 0 ? (
          <EmptyState
            title="No leave requests yet"
            description="Once you submit leave, your latest requests will be listed here."
            icon={Clock3}
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {requests.slice(0, 3).map((request) => (
              <div key={request.id} className="rounded-xl border border-border-base bg-paper-sunken/20 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink-base">
                      {request.policy?.name ?? 'Leave request'}
                    </p>
                    <p className="mt-1 text-sm text-ink-muted">{request.days} day(s)</p>
                  </div>
                  <span
                    className={
                      request.status === 'approved'
                        ? 'status-badge status-badge-success'
                        : request.status === 'pending'
                          ? 'status-badge status-badge-warning'
                          : 'status-badge status-badge-neutral'
                    }
                  >
                    {request.status}
                  </span>
                </div>
                <p className="mt-5 text-xs uppercase tracking-[0.16em] text-ink-muted">
                  {formatDate(request.start_date)} to {formatDate(request.end_date)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
