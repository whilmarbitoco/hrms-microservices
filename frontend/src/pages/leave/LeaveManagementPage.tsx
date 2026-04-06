import { useMemo, useState } from 'react';
import {
  useApproveLeaveRequest,
  useCancelLeaveRequest,
  useCreateLeaveRequest,
  useLeaveBalances,
  useLeavePolicies,
  useLeaveRequests,
  useRejectLeaveRequest,
} from '../../hooks/useLeave';
import { Table, TableCell, TableRow } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Loader } from '../../components/ui/Loader';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { AlertCircle, CalendarDays, Check, Filter, Info, Plus, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn, formatDate } from '../../lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const leaveRequestSchema = z.object({
  employee_id: z.string().min(1, 'Employee ID is required'),
  policy_id: z.string().min(1, 'Policy is required'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  reason: z.string().optional(),
});

type LeaveRequestForm = z.infer<typeof leaveRequestSchema>;

export default function LeaveManagementPage() {
  const { hasPermission, user } = useAuth();
  const isEmployee = user?.role === 'employee';
  const [statusFilter, setStatusFilter] = useState('pending');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const requestFilters = useMemo(
    () => ({
      status: statusFilter || undefined,
      employee_id: isEmployee ? user?.employee_id ?? undefined : undefined,
    }),
    [isEmployee, statusFilter, user?.employee_id]
  );

  const requestsQuery = useLeaveRequests(requestFilters);
  const balancesQuery = useLeaveBalances(isEmployee ? user?.employee_id ?? undefined : undefined);
  const { data: policies } = useLeavePolicies();
  const createMutation = useCreateLeaveRequest();
  const approveMutation = useApproveLeaveRequest();
  const rejectMutation = useRejectLeaveRequest();
  const cancelMutation = useCancelLeaveRequest();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<LeaveRequestForm>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: {
      employee_id: user?.employee_id || '',
    },
  });

  const onSubmit = (data: LeaveRequestForm) => {
    createMutation.mutate(
      {
        ...data,
        policy_id: Number(data.policy_id),
      },
      {
        onSuccess: () => {
          setIsModalOpen(false);
          reset({ employee_id: user?.employee_id || '', policy_id: '', start_date: '', end_date: '', reason: '' });
        },
      }
    );
  };

  const handleReject = () => {
    if (!selectedRequest) return;
    rejectMutation.mutate(
      {
        id: selectedRequest.id,
        reason: rejectionReason,
      },
      {
        onSuccess: () => {
          setIsRejectModalOpen(false);
          setRejectionReason('');
          setSelectedRequest(null);
        },
      }
    );
  };

  if (requestsQuery.isLoading || balancesQuery.isLoading) return <Loader fullPage />;
  if (requestsQuery.isError) {
    return <ErrorState message={(requestsQuery.error as any).error || 'Failed to load leave requests'} onRetry={requestsQuery.refetch} />;
  }
  if (balancesQuery.isError) {
    return <ErrorState message={(balancesQuery.error as any).error || 'Failed to load leave balances'} onRetry={balancesQuery.refetch} />;
  }

  const requests = requestsQuery.data ?? [];
  const balances = balancesQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{isEmployee ? 'My Leave' : 'Leave Management'}</h1>
          <p className="text-slate-500">
            {isEmployee
              ? 'Review your leave balances, submit requests, and track approvals.'
              : 'Track incoming leave requests and keep employee availability accurate.'}
          </p>
        </div>
        {hasPermission('leave_request.create') && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Apply for Leave
          </Button>
        )}
      </div>

      {isEmployee && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {balances.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500 md:col-span-2 xl:col-span-4">
              Leave balances will appear here once policies are assigned to your employee record.
            </div>
          ) : (
            balances.map((balance) => (
              <div key={balance.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {balance.policy?.type ?? 'leave'}
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{balance.policy?.name ?? `Policy #${balance.policy_id}`}</p>
                <p className="mt-4 text-3xl font-bold text-slate-900">{Number(balance.balance).toFixed(1)}</p>
                <p className="text-sm text-slate-500">available days</p>
              </div>
            ))
          )}
        </div>
      )}

      <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
        <Filter className="h-4 w-4 text-slate-400" />
        <div className="flex flex-wrap gap-2">
          {['pending', 'approved', 'rejected', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors',
                statusFilter === status
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {requests.length === 0 ? (
        <EmptyState
          title="No leave requests"
          description={`No ${statusFilter} leave requests found.`}
          icon={CalendarDays}
          action={hasPermission('leave_request.create') && <Button onClick={() => setIsModalOpen(true)}>Apply for Leave</Button>}
        />
      ) : (
        <Table headers={isEmployee ? ['Type', 'Dates', 'Days', 'Status', 'Review', 'Actions'] : ['Employee ID', 'Type', 'Dates', 'Days', 'Status', 'Actions']}>
          {requests.map((req) => (
            <TableRow key={req.id}>
              {!isEmployee && <TableCell className="font-medium text-slate-900">{req.employee_id}</TableCell>}
              <TableCell>
                <div>
                  <p className="font-medium text-slate-900">{req.policy?.name ?? `Policy #${req.policy_id}`}</p>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{req.policy?.type ?? 'leave'}</p>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-xs">
                  <p className="font-medium">{formatDate(req.start_date)}</p>
                  <p className="text-slate-400">to {formatDate(req.end_date)}</p>
                </div>
              </TableCell>
              <TableCell>{req.days}</TableCell>
              <TableCell>
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
                    req.status === 'approved' && 'bg-green-100 text-green-800',
                    req.status === 'pending' && 'bg-amber-100 text-amber-800',
                    req.status === 'rejected' && 'bg-red-100 text-red-800',
                    req.status === 'cancelled' && 'bg-slate-100 text-slate-800'
                  )}
                >
                  {req.status}
                </span>
              </TableCell>
              {isEmployee && (
                <TableCell>
                  {req.reviewed_by ? (
                    <div className="text-xs">
                      <p className="font-medium text-slate-900">{req.reviewed_by}</p>
                      <p className="text-slate-400">{req.reviewed_at ? formatDate(req.reviewed_at) : 'Reviewed'}</p>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">Awaiting review</span>
                  )}
                </TableCell>
              )}
              <TableCell>
                <div className="flex items-center gap-2">
                  {req.status === 'pending' && hasPermission('leave_request.approve') && !isEmployee && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-green-600 hover:bg-green-50 hover:text-green-700"
                      onClick={() => approveMutation.mutate(req.id)}
                      isLoading={approveMutation.isPending && approveMutation.variables === req.id}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  {req.status === 'pending' && hasPermission('leave_request.reject') && !isEmployee && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => {
                        setSelectedRequest(req);
                        setIsRejectModalOpen(true);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  {req.status === 'pending' && hasPermission('leave_request.cancel') && req.employee_id === user?.employee_id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      onClick={() => cancelMutation.mutate(req.id)}
                      isLoading={cancelMutation.isPending && cancelMutation.variables === req.id}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" title={req.reason ?? 'No reason provided'}>
                    <Info className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </Table>
      )}

      <Modal isOpen={isRejectModalOpen} onClose={() => setIsRejectModalOpen(false)} title="Reject Leave Request">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Please provide a reason for rejecting this leave request.</p>
          <Input
            label="Reason"
            placeholder="e.g. Critical project deadline"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            required
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsRejectModalOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleReject} isLoading={rejectMutation.isPending} disabled={!rejectionReason}>
              Reject Request
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Apply for Leave">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="mb-2 flex gap-3 rounded-lg border border-blue-100 bg-blue-50 p-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-blue-600" />
            <p className="text-xs text-blue-700">
              {isEmployee
                ? 'Your request will be sent for approval. Check your remaining balance before submitting.'
                : 'Use this form to create a leave request for a specific employee record.'}
            </p>
          </div>

          <Input
            label="Employee ID"
            {...register('employee_id')}
            error={errors.employee_id?.message}
            disabled={Boolean(user?.employee_id)}
          />

          <Select
            label="Leave Type"
            options={[
              { label: 'Select Policy', value: '' },
              ...(policies?.map((policy) => ({ label: policy.name, value: policy.id.toString() })) || []),
            ]}
            {...register('policy_id')}
            error={errors.policy_id?.message}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date" type="date" {...register('start_date')} error={errors.start_date?.message} />
            <Input label="End Date" type="date" {...register('end_date')} error={errors.end_date?.message} />
          </div>

          <Input
            label="Reason (Optional)"
            placeholder="Family vacation, personal matter, etc."
            {...register('reason')}
            error={errors.reason?.message}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={createMutation.isPending}>Submit Request</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
