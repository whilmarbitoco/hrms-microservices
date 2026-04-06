import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { toast } from '../components/ui/Toaster';

export interface SalaryComponent {
  id: number;
  employee_id: string;
  type: 'base' | 'allowance' | 'deduction';
  name: string;
  amount: string;
}

export interface PayrollBatch {
  id: number;
  name: string;
  cycle: 'monthly' | 'semi-monthly';
  period_start: string;
  period_end: string;
  status: 'draft' | 'processed';
  processed_at?: string;
}

export interface Payslip {
  id: number;
  employee_id: string;
  batch_id: number;
  gross: string;
  deductions: string;
  net: string;
  status: 'generated' | 'sent' | 'acknowledged';
  generated_at?: string;
}

export const useSalaryComponents = (employeeId?: string) => {
  return useQuery<SalaryComponent[]>({
    queryKey: ['salary-components', employeeId],
    queryFn: async () => {
      const url = employeeId
        ? `/payroll/salary-components/employee/${employeeId}`
        : '/payroll/salary-components';
      const { data } = await api.get(url);
      return data;
    },
  });
};

export const useCreateSalaryComponent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.post('/payroll/salary-components', payload);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['salary-components', variables.employee_id] });
      toast.success('Salary component added');
    },
  });
};

export const useUpdateSalaryComponent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
      const { data } = await api.patch(`/payroll/salary-components/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-components'] });
      toast.success('Salary component updated');
    },
  });
};

export const useDeleteSalaryComponent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.delete(`/payroll/salary-components/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-components'] });
      toast.success('Salary component removed');
    },
  });
};

export const usePayrollBatches = (enabled = true) => {
  return useQuery<PayrollBatch[]>({
    queryKey: ['payroll-batches'],
    queryFn: async () => {
      const { data } = await api.get('/payroll/batches');
      return data;
    },
    enabled,
  });
};

export const useCreatePayrollBatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.post('/payroll/batches', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-batches'] });
      toast.success('Payroll batch created');
    },
  });
};

export const useProcessPayrollBatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.post(`/payroll/batches/${id}/process`);
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['payroll-batches'] });
      queryClient.invalidateQueries({ queryKey: ['payroll-batches', id] });
      toast.success('Payroll processed successfully');
    },
    onError: (error: any) => {
      toast.error(error);
    },
  });
};

export const usePayslips = (batchId?: number, enabled = true) => {
  return useQuery<Payslip[]>({
    queryKey: ['payslips', batchId],
    queryFn: async () => {
      const url = batchId ? `/payroll/payslips/batch/${batchId}` : '/payroll/payslips';
      const { data } = await api.get(url);
      return data;
    },
    enabled: enabled && !!batchId,
  });
};

export const useEmployeePayslips = (employeeId?: string, enabled = true) => {
  return useQuery<Payslip[]>({
    queryKey: ['employee-payslips', employeeId],
    queryFn: async () => {
      const { data } = await api.get(`/payroll/payslips/employee/${employeeId}`);
      return data;
    },
    enabled: enabled && Boolean(employeeId),
  });
};
