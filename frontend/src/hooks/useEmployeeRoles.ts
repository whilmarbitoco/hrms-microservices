import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { toast } from '../components/ui/Toaster';

export interface EmployeeRole {
  id: number;
  name: string;
  description?: string;
  level?: 'junior' | 'mid' | 'senior' | 'lead' | 'principal';
  employee_count?: number;
}

export interface CreateEmployeeRolePayload {
  name: string;
  description?: string;
  level?: string;
}

export const useEmployeeRoles = () => {
  return useQuery<EmployeeRole[]>({
    queryKey: ['employee-roles'],
    queryFn: async () => {
      const { data } = await api.get('/employee-roles');
      return data;
    },
  });
};

export const useEmployeeRole = (id: number | string) => {
  return useQuery<EmployeeRole>({
    queryKey: ['employee-roles', id],
    queryFn: async () => {
      const { data } = await api.get(`/employee-roles/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateEmployeeRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateEmployeeRolePayload) => {
      const { data } = await api.post('/employee-roles', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-roles'] });
      toast.success('Role created successfully');
    },
    onError: (error: any) => {
      toast.error(error);
    },
  });
};

export const useUpdateEmployeeRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: Partial<CreateEmployeeRolePayload> }) => {
      const { data } = await api.patch(`/employee-roles/${id}`, payload);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employee-roles'] });
      queryClient.invalidateQueries({ queryKey: ['employee-roles', variables.id] });
      toast.success('Role updated successfully');
    },
    onError: (error: any) => {
      toast.error(error);
    },
  });
};

export const useDeleteEmployeeRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/employee-roles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-roles'] });
      toast.success('Role deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error);
    },
  });
};
