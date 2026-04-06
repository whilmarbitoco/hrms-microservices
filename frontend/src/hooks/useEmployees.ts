import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { toast } from '../components/ui/Toaster';

export interface Employee {
  id: number;
  employee_id: string;
  name: string;
  email: string;
  phone?: string | null;
  department_id?: number | null;
  role_id?: number | null;
  manager_id?: number | null;
  status: 'active' | 'terminated';
  hired_at?: string | null;
  terminated_at?: string | null;
  department?: {
    id: number;
    name: string;
  } | null;
  role?: {
    id: number;
    name: string;
    level?: string | null;
  } | null;
}

export interface CreateEmployeePayload {
  name: string;
  email: string;
  phone?: string;
  department_id?: number;
  role_id?: number;
  manager_id?: number;
  hired_at?: string;
}

export interface EmployeeHistoryEntry {
  id: number;
  action: string;
  changed_by?: string | null;
  metadata_?: Record<string, unknown> | null;
  created_at: string;
}

export const useEmployees = (params?: any) => {
  return useQuery<Employee[]>({
    queryKey: ['employees', params],
    queryFn: async () => {
      const { data } = await api.get('/employees', { params });
      return data;
    },
  });
};

export const useEmployee = (id: number | string) => {
  return useQuery<Employee>({
    queryKey: ['employees', id],
    queryFn: async () => {
      const { data } = await api.get(`/employees/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateEmployeePayload) => {
      const { data } = await api.post('/employees', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee created successfully');
    },
    onError: (error: any) => {
      toast.error(error);
    },
  });
};

export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: Partial<CreateEmployeePayload> }) => {
      const { data } = await api.patch(`/employees/${id}`, payload);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employees', variables.id] });
      toast.success('Employee updated successfully');
    },
    onError: (error: any) => {
      toast.error(error);
    },
  });
};

export const useTerminateEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason, terminated_at }: { id: number; reason: string; terminated_at?: string }) => {
      const { data } = await api.post(`/employees/${id}/terminate`, { reason, terminated_at });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employees', variables.id] });
      toast.success('Employee terminated');
    },
    onError: (error: any) => {
      toast.error(error);
    },
  });
};

export const useRehireEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
      const { data } = await api.post(`/employees/${id}/rehire`, payload);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employees', variables.id] });
      toast.success('Employee rehired successfully');
    },
    onError: (error: any) => {
      toast.error(error);
    },
  });
};

export const useEmployeeHistory = (id: number | string) => {
  return useQuery<EmployeeHistoryEntry[]>({
    queryKey: ['employees', id, 'history'],
    queryFn: async () => {
      const { data } = await api.get(`/employees/${id}/history`);
      return data;
    },
    enabled: !!id,
  });
};
