import { useState } from 'react';
import { useLeaveRequests, useLeavePolicies, useCreateLeaveRequest, useApproveLeaveRequest, useRejectLeaveRequest } from '../../hooks/useLeave';
import { Table, TableRow, TableCell } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Loader } from '../../components/ui/Loader';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Plus, CalendarDays, Check, X, Info, Filter, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatDate, cn } from '../../lib/utils';
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
  const [statusFilter, setStatusFilter] = useState('pending');
  
  const { data: requests, isLoading, isError, error, refetch } = useLeaveRequests({
    status: statusFilter || undefined,
  });
  
  const { data: policies } = useLeavePolicies();
  const createMutation = useCreateLeaveRequest();
  const approveMutation = useApproveLeaveRequest();
  const rejectMutation = useRejectLeaveRequest();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<LeaveRequestForm>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: {
      employee_id: user?.employee_id || '',
    }
  });

  const onSubmit = (data: LeaveRequestForm) => {
    createMutation.mutate({
      ...data,
      policy_id: Number(data.policy_id),
    }, {
      onSuccess: () => {
        setIsModalOpen(false);
        reset();
      }
    });
  };

  const handleReject = () => {
    if (!selectedRequest) return;
    rejectMutation.mutate({
      id: selectedRequest.id,
      reason: rejectionReason
    }, {
      onSuccess: () => {
        setIsRejectModalOpen(false);
        setRejectionReason('');
        setSelectedRequest(null);
      }
    });
  };

  if (isLoading) return <Loader fullPage />;
  if (isError) return <ErrorState message={(error as any).error || 'Failed to load leave requests'} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Leave Management</h1>
          <p className="text-slate-500">Track and manage employee leave applications.</p>
        </div>
        {hasPermission('leave_request.create') && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Apply for Leave
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <Filter className="h-4 w-4 text-slate-400" />
        <div className="flex gap-2">
          {['pending', 'approved', 'rejected', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors",
                statusFilter === status 
                  ? "bg-indigo-100 text-indigo-700" 
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {!requests || requests.length === 0 ? (
        <EmptyState 
          title="No leave requests" 
          description={`No ${statusFilter} leave requests found.`}
          icon={CalendarDays}
          action={hasPermission('leave_request.create') && <Button onClick={() => setIsModalOpen(true)}>Apply for Leave</Button>}
        />
      ) : (
        <Table headers={['Employee', 'Type', 'Dates', 'Days', 'Status', 'Actions']}>
          {requests.map((req) => (
            <TableRow key={req.id}>
              <TableCell className="font-medium text-slate-900">{req.employee_name || 'N/A'}</TableCell>
              <TableCell>{req.policy_name || 'N/A'}</TableCell>
              <TableCell>
                <div className="text-xs">
                  <p className="font-medium">{formatDate(req.start_date)}</p>
                  <p className="text-slate-400">to {formatDate(req.end_date)}</p>
                </div>
              </TableCell>
              <TableCell>{req.total_days || 0}</TableCell>
              <TableCell>
                <span className={cn(
                  "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize",
                  req.status === 'approved' && "bg-green-100 text-green-800",
                  req.status === 'pending' && "bg-amber-100 text-amber-800",
                  req.status === 'rejected' && "bg-red-100 text-red-800",
                  req.status === 'cancelled' && "bg-slate-100 text-slate-800"
                )}>
                  {req.status}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {req.status === 'pending' && hasPermission('leave_request.approve') && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      onClick={() => approveMutation.mutate(req.id)}
                      isLoading={approveMutation.isPending && approveMutation.variables === req.id}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  {req.status === 'pending' && hasPermission('leave_request.reject') && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => {
                        setSelectedRequest(req);
                        setIsRejectModalOpen(true);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm">
                    <Info className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </Table>
      )}

      {/* Rejection Modal */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="Reject Leave Request"
      >
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
            <Button 
              variant="danger" 
              onClick={handleReject}
              isLoading={rejectMutation.isPending}
              disabled={!rejectionReason}
            >
              Reject Request
            </Button>
          </div>
        </div>
      </Modal>

      {/* Apply Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Apply for Leave"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex gap-3 mb-2">
            <AlertCircle className="h-5 w-5 text-blue-600 shrink-0" />
            <p className="text-xs text-blue-700">
              Your leave request will be sent to your manager for approval. 
              Ensure you have sufficient balance before applying.
            </p>
          </div>
          
          <Input 
            label="Employee ID" 
            {...register('employee_id')}
            error={errors.employee_id?.message}
            disabled={!!user?.employee_id}
          />

          <Select 
            label="Leave Type"
            options={[
              { label: 'Select Policy', value: '' },
              ...(policies?.map(p => ({ label: p.name, value: p.id.toString() })) || [])
            ]}
            {...register('policy_id')}
            error={errors.policy_id?.message}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Start Date" 
              type="date"
              {...register('start_date')}
              error={errors.start_date?.message}
            />
            <Input 
              label="End Date" 
              type="date"
              {...register('end_date')}
              error={errors.end_date?.message}
            />
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
