import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertCircle,
  CalendarDays,
  Check,
  Filter,
  Info,
  Plus,
  UserCircle,
  X,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Input } from '../../components/ui/Input';
import { Loader } from '../../components/ui/Loader';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { Table, TableCell, TableRow } from '../../components/ui/Table';
import { useAuth } from '../../context/AuthContext';
import {
  useApproveLeaveRequest,
  useCancelLeaveRequest,
  useCreateLeaveRequest,
  useLeaveBalances,
  useLeavePolicies,
  useLeaveRequests,
  useRejectLeaveRequest,
} from '../../hooks/useLeave';
import { formatDate } from '../../lib/utils';

const leaveRequestSchema = z.object({
  employee_id: z.string().min(1, 'Employee ID is required'),
  policy_id: z.string().min(1, 'Leave policy is required'),
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

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LeaveRequestForm>({
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
    return (
      <ErrorState
        title="Unable to load leave requests"
        message={(requestsQuery.error as any).error || 'The leave request queue could not be synchronized.'}
        onRetry={requestsQuery.refetch}
      />
    );
  }
  if (balancesQuery.isError) {
    return (
      <ErrorState
        title="Unable to load leave balances"
        message={(balancesQuery.error as any).error || 'The leave balance summary could not be synchronized.'}
        onRetry={balancesQuery.refetch}
      />
    );
  }

  const requests = requestsQuery.data ?? [];
  const balances = balancesQuery.data ?? [];

  return (
    <div className="page-shell">
      <header className="page-header">
        <div className="page-heading">
          <div className="page-eyebrow">
            <span>Leave management</span>
            <span>/</span>
            <span>{isEmployee ? 'Self service' : 'Approval workspace'}</span>
          </div>
          <h1 className="page-title">{isEmployee ? 'My leave' : 'Leave requests'}</h1>
          <p className="page-subtitle">
            {isEmployee
              ? 'Review your balances, submit leave requests, and track approval status.'
              : 'Manage incoming leave requests, review status, and process approvals or rejections.'}
          </p>
        </div>
        {hasPermission('leave_request.create') && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4" />
            New leave request
          </Button>
        )}
      </header>

      {isEmployee && (
        <section className="metric-grid">
          {balances.length === 0 ? (
            <div className="md:col-span-2 xl:col-span-4">
              <EmptyState
                title="No leave balances assigned"
                description="Your balance summary will appear here once leave policies are assigned."
                icon={CalendarDays}
              />
            </div>
          ) : (
            balances.map((balance) => (
              <div key={balance.id} className="metric-card">
                <p className="metric-label">{balance.policy?.name ?? 'Leave policy'}</p>
                <p className="metric-value">{Number(balance.balance).toFixed(1)}</p>
                <p className="metric-meta">{balance.policy?.type ?? 'Policy balance'} available</p>
              </div>
            ))
          )}
        </section>
      )}

      <section className="toolbar">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3 text-sm text-ink-muted">
            <Filter className="h-4 w-4 text-accent-base" />
            Filter requests by status
          </div>
          <div className="flex flex-wrap gap-2">
            {['pending', 'approved', 'rejected', 'cancelled'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={
                  statusFilter === status
                    ? 'status-badge status-badge-neutral border-ink-base bg-ink-base text-paper-raised'
                    : 'status-badge status-badge-neutral'
                }
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="section-card">
        <div className="section-header">
          <div>
            <h2 className="section-title">{isEmployee ? 'My requests' : 'Request queue'}</h2>
            <p className="section-description">
              {requests.length} request(s) match the current status filter.
            </p>
          </div>
        </div>

        {requests.length === 0 ? (
          <EmptyState
            title="No leave requests found"
            description="There are no requests that match the selected status right now."
            icon={CalendarDays}
            action={
              hasPermission('leave_request.create') ? (
                <Button variant="outline" onClick={() => setIsModalOpen(true)}>
                  Create request
                </Button>
              ) : null
            }
          />
        ) : (
          <Table
            headers={
              isEmployee
                ? ['Policy', 'Date range', 'Days', 'Status', 'Reviewed by', 'Actions']
                : ['Employee', 'Policy', 'Date range', 'Days', 'Status', 'Actions']
            }
          >
            {requests.map((request) => (
              <TableRow key={request.id}>
                {!isEmployee && (
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <div className="rounded-2xl border border-border-base bg-paper-sunken p-3">
                        <UserCircle className="h-5 w-5 text-accent-base" />
                      </div>
                      <span className="text-sm font-semibold text-ink-base">
                        Employee #{request.employee_id}
                      </span>
                    </div>
                  </TableCell>
                )}
                <TableCell>
                  <div>
                    <p className="text-sm font-semibold text-ink-base">
                      {request.policy?.name ?? `Policy #${request.policy_id}`}
                    </p>
                    <p className="mt-1 text-sm text-ink-muted">
                      {request.policy?.type ?? 'Leave policy'}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-ink-muted">
                  {formatDate(request.start_date)} to {formatDate(request.end_date)}
                </TableCell>
                <TableCell className="text-sm font-semibold text-ink-base">{request.days}</TableCell>
                <TableCell>
                  <span
                    className={
                      request.status === 'approved'
                        ? 'status-badge status-badge-success'
                        : request.status === 'pending'
                          ? 'status-badge status-badge-warning'
                          : request.status === 'rejected'
                            ? 'status-badge status-badge-danger'
                            : 'status-badge status-badge-neutral'
                    }
                  >
                    {request.status}
                  </span>
                </TableCell>
                {isEmployee && (
                  <TableCell className="text-sm text-ink-muted">
                    {request.reviewed_by ? `${request.reviewed_by} on ${request.reviewed_at ? formatDate(request.reviewed_at) : 'review date unavailable'}` : 'Awaiting review'}
                  </TableCell>
                )}
                <TableCell>
                  <div className="flex items-center gap-2">
                    {request.status === 'pending' && hasPermission('leave_request.approve') && !isEmployee && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-success-base hover:bg-success-base hover:text-white"
                        onClick={() => approveMutation.mutate(request.id)}
                        isLoading={approveMutation.isPending && approveMutation.variables === request.id}
                        title="Approve request"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    {request.status === 'pending' && hasPermission('leave_request.reject') && !isEmployee && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-error-base hover:bg-error-base hover:text-white"
                        onClick={() => {
                          setSelectedRequest(request);
                          setIsRejectModalOpen(true);
                        }}
                        title="Reject request"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    {request.status === 'pending' && hasPermission('leave_request.cancel') && request.employee_id === user?.employee_id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => cancelMutation.mutate(request.id)}
                        isLoading={cancelMutation.isPending && cancelMutation.variables === request.id}
                      >
                        Cancel
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" title={request.reason ?? 'No reason provided'}>
                      <Info className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </Table>
        )}
      </section>

      <Modal isOpen={isRejectModalOpen} onClose={() => setIsRejectModalOpen(false)} title="Reject leave request">
        <div className="space-y-6">
          <div className="info-strip border-error-base/20 bg-error-base/5 text-ink-muted">
            <X className="mt-0.5 h-5 w-5 shrink-0 text-error-base" />
            <div>
              <p className="font-semibold text-ink-base">Provide a rejection reason.</p>
              <p className="mt-1 leading-7">
                The employee will see this reason when the request status is updated.
              </p>
            </div>
          </div>
          <Input
            label="Rejection reason"
            placeholder="Enter a brief explanation"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            required
          />
          <div className="flex justify-end gap-3 border-t border-border-faint pt-5">
            <Button variant="ghost" onClick={() => setIsRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleReject} isLoading={rejectMutation.isPending} disabled={!rejectionReason}>
              Reject request
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New leave request">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="info-strip border-accent-base/20 bg-accent-base/5 text-ink-muted">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-accent-base" />
            <div>
              <p className="font-semibold text-ink-base">Review details before submitting.</p>
              <p className="mt-1 leading-7">
                {isEmployee
                  ? 'Your request will be sent for approval after submission.'
                  : 'You are creating a leave request on behalf of an employee.'}
              </p>
            </div>
          </div>

          <div className="grid gap-5">
            <Input
              label="Employee ID"
              {...register('employee_id')}
              error={errors.employee_id?.message}
              disabled={Boolean(user?.employee_id)}
            />

            <Select
              label="Leave policy"
              options={[
                { label: 'Select leave policy', value: '' },
                ...(policies?.map((policy) => ({
                  label: policy.name,
                  value: policy.id.toString(),
                })) || []),
              ]}
              {...register('policy_id')}
              error={errors.policy_id?.message}
            />

            <div className="grid gap-5 md:grid-cols-2">
              <Input label="Start date" type="date" {...register('start_date')} error={errors.start_date?.message} />
              <Input label="End date" type="date" {...register('end_date')} error={errors.end_date?.message} />
            </div>

            <Input
              label="Reason"
              placeholder="Optional note or justification"
              {...register('reason')}
              error={errors.reason?.message}
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-border-faint pt-5">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Submit request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
