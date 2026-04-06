import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { toast } from '../components/ui/Toaster';

export interface LeavePolicy {
  id: number;
  name: string;
  type: 'vacation' | 'sick' | 'unpaid' | 'maternity' | 'paternity';
  max_days: string;
  accrual_rate: string;
  accrual_frequency: 'monthly' | 'yearly';
}

export interface LeaveBalance {
  id: number;
  employee_id: string;
  policy_id: number;
  balance: string;
  accrued_at?: string;
  policy?: {
    id: number;
    name: string;
    type: string;
  } | null;
}

export interface LeaveRequest {
  id: number;
  employee_id: string;
  policy_id: number;
  start_date: string;
  end_date: string;
  days: string;
  reason?: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  policy?: {
    id: number;
    name: string;
    type: string;
  } | null;
}

type LeaveRequestFilters = Record<string, string | number | undefined>;

export const useLeavePolicies = () => {
  return useQuery<LeavePolicy[]>({
    queryKey: ['leave-policies'],
    queryFn: async () => {
      const { data } = await api.get('/leave/policies');
      return data;
    },
  });
};

export const useLeaveBalances = (employeeId?: string) => {
  return useQuery<LeaveBalance[]>({
    queryKey: ['leave-balances', employeeId],
    queryFn: async () => {
      const url = employeeId ? `/leave/balances/${employeeId}` : '/leave/balances';
      const { data } = await api.get(url);
      return data;
    },
    enabled: employeeId !== '',
  });
};

export const useLeaveRequests = (params?: LeaveRequestFilters, enabled = true) => {
  return useQuery<LeaveRequest[]>({
    queryKey: ['leave-requests', params],
    queryFn: async () => {
      const { data } = await api.get('/leave/requests', { params });
      return data;
    },
    enabled,
  });
};

export const useCreateLeaveRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.post('/leave/requests', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['leave-balances'] });
      toast.success('Leave request submitted');
    },
    onError: (error: any) => {
      toast.error(error);
    },
  });
};

export const useApproveLeaveRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.post(`/leave/requests/${id}/approve`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['leave-balances'] });
      toast.success('Leave request approved');
    },
    onError: (error: any) => {
      toast.error(error);
    },
  });
};

export const useRejectLeaveRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const { data } = await api.post(`/leave/requests/${id}/reject`, { reason });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      toast.success('Leave request rejected');
    },
    onError: (error: any) => {
      toast.error(error);
    },
  });
};

export const useCancelLeaveRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.post(`/leave/requests/${id}/cancel`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['leave-balances'] });
      toast.success('Leave request cancelled');
    },
    onError: (error: any) => {
      toast.error(error);
    },
  });
};

export const useLeaveCalendar = (fromDate: string, toDate: string, departmentId?: string) => {
  return useQuery<LeaveRequest[]>({
    queryKey: ['leave-calendar', fromDate, toDate, departmentId],
    queryFn: async () => {
      const { data } = await api.get('/leave/requests/calendar', {
        params: {
          from_date: fromDate,
          to_date: toDate,
          department_id: departmentId || undefined,
        },
      });
      return data;
    },
    enabled: Boolean(fromDate && toDate),
  });
};
