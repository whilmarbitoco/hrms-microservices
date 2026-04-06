import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { toast } from '../components/ui/Toaster';

export interface Department {
  id: number;
  name: string;
  description?: string;
  manager_id?: number;
  employee_count?: number;
}

export interface CreateDepartmentPayload {
  name: string;
  description?: string;
  manager_id?: number;
}

export const useDepartments = () => {
  return useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data } = await api.get('/departments');
      return data;
    },
  });
};

export const useDepartment = (id: number | string) => {
  return useQuery<Department>({
    queryKey: ['departments', id],
    queryFn: async () => {
      const { data } = await api.get(`/departments/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateDepartmentPayload) => {
      const { data } = await api.post('/departments', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Department created successfully');
    },
    onError: (error: any) => {
      toast.error(error);
    },
  });
};

export const useUpdateDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: Partial<CreateDepartmentPayload> }) => {
      const { data } = await api.patch(`/departments/${id}`, payload);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['departments', variables.id] });
      toast.success('Department updated successfully');
    },
    onError: (error: any) => {
      toast.error(error);
    },
  });
};

export const useDeleteDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/departments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Department deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error);
    },
  });
};
