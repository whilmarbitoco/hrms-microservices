import { motion } from 'motion/react';
import { CalendarDays, Clock3, FileText, Wallet, ArrowRight, CircleAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLeaveBalances, useLeaveRequests } from '../../hooks/useLeave';
import { useEmployeePayslips } from '../../hooks/usePayroll';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';
import { Loader } from '../ui/Loader';
import { formatCurrency, formatDate } from '../../lib/utils';

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
      <EmptyState
        title="Employee profile not linked"
        description="This account does not have an employee record yet, so self-service data cannot be loaded."
        icon={CircleAlert}
      />
    );
  }

  if (balancesQuery.isLoading || requestsQuery.isLoading || payslipsQuery.isLoading) {
    return <Loader fullPage />;
  }

  if (balancesQuery.isError || requestsQuery.isError || payslipsQuery.isError) {
    return (
      <ErrorState
        message="Failed to load your leave and payroll overview."
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
    { label: 'Leave Balance', value: `${totalBalance.toFixed(1)} days`, icon: CalendarDays, color: 'bg-sky-600' },
    { label: 'Pending Requests', value: pendingRequests.toString(), icon: Clock3, color: 'bg-amber-500' },
    { label: 'Approved Leaves', value: approvedRequests.toString(), icon: FileText, color: 'bg-emerald-600' },
    {
      label: 'Latest Net Pay',
      value: latestPayslip ? formatCurrency(latestPayslip.net) : 'No payslip',
      icon: Wallet,
      color: 'bg-slate-900',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Employee Workspace</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Your leave and payroll at a glance</h1>
          <p className="max-w-2xl text-sm text-slate-600">
            Review balances, recent requests, and payslips without digging through separate pages.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/payroll')}>
            <Wallet className="mr-2 h-4 w-4" />
            My Payslips
          </Button>
          <Button onClick={() => navigate('/leave')}>
            <CalendarDays className="mr-2 h-4 w-4" />
            Request Leave
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
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
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

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Leave balances</h2>
              <p className="text-sm text-slate-500">Current available days by policy.</p>
            </div>
            <Button variant="ghost" onClick={() => navigate('/leave')}>
              Open leave page
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <div className="mt-6 space-y-3">
            {balances.length === 0 ? (
              <EmptyState
                title="No leave balances yet"
                description="Balances will appear here once leave policies are assigned."
                icon={CalendarDays}
                className="border-none bg-slate-50 p-8"
              />
            ) : (
              balances.map((balance) => (
                <div
                  key={balance.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-slate-900">{balance.policy?.name ?? `Policy #${balance.policy_id}`}</p>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      {balance.policy?.type ?? 'leave'} policy
                    </p>
                  </div>
                  <p className="text-xl font-bold text-slate-900">{Number(balance.balance).toFixed(1)}</p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Latest payslips</h2>
            <p className="text-sm text-slate-500">Your most recent payroll records.</p>
          </div>
          <div className="mt-6 space-y-3">
            {payslips.length === 0 ? (
              <EmptyState
                title="No payslips generated"
                description="Payslips will show up here after payroll is processed."
                icon={Wallet}
                className="border-none bg-white/70 p-8"
              />
            ) : (
              payslips.slice(0, 3).map((payslip) => (
                <div key={payslip.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-slate-900">Batch #{payslip.batch_id}</p>
                      <p className="text-sm text-slate-500">
                        {payslip.generated_at ? formatDate(payslip.generated_at) : 'Generated recently'}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-700">
                      {payslip.status}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-slate-500">Gross</p>
                      <p className="font-semibold text-slate-900">{formatCurrency(payslip.gross)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Deductions</p>
                      <p className="font-semibold text-rose-700">{formatCurrency(payslip.deductions)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Net</p>
                      <p className="font-semibold text-emerald-700">{formatCurrency(payslip.net)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Recent leave requests</h2>
            <p className="text-sm text-slate-500">Your latest leave activity and approvals.</p>
          </div>
          <Button variant="ghost" onClick={() => navigate('/leave')}>
            Manage requests
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        <div className="mt-6 space-y-3">
          {requests.length === 0 ? (
            <EmptyState
              title="No requests yet"
              description="Submit your first leave request to start tracking approvals."
              icon={FileText}
              className="border-none bg-slate-50 p-8"
            />
          ) : (
            requests.slice(0, 4).map((request) => (
              <div key={request.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium text-slate-900">{request.policy?.name ?? `Policy #${request.policy_id}`}</p>
                  <p className="text-sm text-slate-500">
                    {formatDate(request.start_date)} to {formatDate(request.end_date)} · {request.days} days
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-700">
                    {request.status}
                  </span>
                  {request.reviewed_by && (
                    <p className="text-xs text-slate-500">Reviewed by {request.reviewed_by}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
