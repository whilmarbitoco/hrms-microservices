import { motion } from 'motion/react';
import { ArrowRight, BriefcaseBusiness, Building2, CalendarDays, UserPlus, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDepartments } from '../../hooks/useDepartments';
import { useEmployeeRoles } from '../../hooks/useEmployeeRoles';
import { useEmployees } from '../../hooks/useEmployees';
import { useLeaveRequests } from '../../hooks/useLeave';
import { Button } from '../ui/Button';
import { ErrorState } from '../ui/ErrorState';
import { Loader } from '../ui/Loader';
import { formatDate } from '../../lib/utils';

export default function HRDashboard({ user }: { user: any }) {
  const navigate = useNavigate();
  const employeesQuery = useEmployees();
  const departmentsQuery = useDepartments();
  const rolesQuery = useEmployeeRoles();
  const leavesQuery = useLeaveRequests({ status: 'pending' });

  if (employeesQuery.isLoading || departmentsQuery.isLoading || rolesQuery.isLoading || leavesQuery.isLoading) {
    return <Loader fullPage />;
  }

  if (employeesQuery.isError || departmentsQuery.isError || rolesQuery.isError || leavesQuery.isError) {
    return (
      <ErrorState
        message="Failed to load HR dashboard data."
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
    { label: 'Active Employees', value: activeEmployees.length.toString(), icon: Users, color: 'bg-sky-600' },
    { label: 'Departments', value: departments.length.toString(), icon: Building2, color: 'bg-slate-900' },
    { label: 'Open Leave Queue', value: pendingLeaves.length.toString(), icon: CalendarDays, color: 'bg-amber-500' },
    { label: 'Defined Roles', value: roles.length.toString(), icon: BriefcaseBusiness, color: 'bg-emerald-600' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">HR Command Center</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">People operations with live workforce data</h1>
          <p className="max-w-2xl text-sm text-slate-600">
            Track headcount, pending approvals, and recent hires from one place.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/leave')}>
            <CalendarDays className="mr-2 h-4 w-4" />
            Review Leave Queue
          </Button>
          <Button onClick={() => navigate('/employees')}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Employee
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

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Pending leave approvals</h2>
              <p className="text-sm text-slate-500">Requests waiting for action from HR.</p>
            </div>
            <Button variant="ghost" onClick={() => navigate('/leave')}>
              Open queue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <div className="mt-6 space-y-3">
            {pendingLeaves.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                No pending leave approvals right now.
              </div>
            ) : (
              pendingLeaves.slice(0, 5).map((request) => (
                <div key={request.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-slate-900">{request.employee_id}</p>
                      <p className="text-sm text-slate-500">
                        {request.policy?.name ?? `Policy #${request.policy_id}`} · {request.days} days
                      </p>
                    </div>
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                      Pending
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">
                    {formatDate(request.start_date)} to {formatDate(request.end_date)}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Recent hires</h2>
            <div className="mt-5 space-y-3">
              {recentHires.length === 0 ? (
                <p className="text-sm text-slate-500">No recent hires available.</p>
              ) : (
                recentHires.map((employee) => (
                  <div key={employee.id} className="rounded-2xl border border-slate-200 p-4">
                    <p className="font-medium text-slate-900">{employee.name}</p>
                    <p className="text-sm text-slate-500">
                      {employee.department?.name ?? 'Unassigned department'} · {employee.role?.name ?? 'Unassigned role'}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                      Hired {employee.hired_at ? formatDate(employee.hired_at) : 'recently'}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Quick access</h2>
            <div className="mt-5 grid gap-3">
              <Button variant="outline" className="justify-between" onClick={() => navigate('/employees')}>
                Employee records
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" className="justify-between" onClick={() => navigate('/departments')}>
                Departments
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" className="justify-between" onClick={() => navigate('/roles')}>
                Employee roles
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
