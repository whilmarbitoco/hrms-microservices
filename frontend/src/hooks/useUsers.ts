import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { toast } from '../components/ui/Toaster';

export interface User {
  id: number;
  email: string;
  name: string;
  role?: string | null;
  employee_id?: string | null;
  is_active: boolean;
  created_at?: string;
}

export interface CreateUserPayload {
  email: string;
  name: string;
  password?: string;
  role_id?: number;
  employee_id?: string;
}

export const useUsers = () => {
  return useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/auth/users');
      return data;
    },
  });
};

export const useUser = (id: number | string) => {
  return useQuery<User>({
    queryKey: ['users', id],
    queryFn: async () => {
      const { data } = await api.get(`/auth/users/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateUserPayload) => {
      const { data } = await api.post('/auth/users', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User created successfully');
    },
    onError: (error: any) => {
      toast.error(error);
    },
  });
};

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, role_id }: { id: number; role_id: number }) => {
      const { data } = await api.patch(`/auth/users/${id}/role`, { role_id });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', variables.id] });
      toast.success('User role updated');
    },
    onError: (error: any) => {
      toast.error(error);
    },
  });
};

export const useDeactivateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.patch(`/auth/users/${id}/deactivate`);
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', id] });
      toast.success('User deactivated');
    },
  });
};

export const useReactivateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.patch(`/auth/users/${id}/reactivate`);
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', id] });
      toast.success('User reactivated');
    },
  });
};
