import { useMemo, useState } from 'react';
import {
  useCreatePayrollBatch,
  useEmployeePayslips,
  usePayrollBatches,
  useProcessPayrollBatch,
} from '../../hooks/usePayroll';
import { Table, TableCell, TableRow } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Loader } from '../../components/ui/Loader';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { AlertCircle, Calendar, FileText, Play, Plus, Wallet } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate } from '../../lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const batchSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  cycle: z.enum(['monthly', 'semi-monthly']),
  period_start: z.string(),
  period_end: z.string(),
});

type BatchForm = z.infer<typeof batchSchema>;

export default function PayrollPage() {
  const { hasPermission, user } = useAuth();
  const isEmployee = user?.role === 'employee';

  const batchesQuery = usePayrollBatches(!isEmployee);
  const payslipsQuery = useEmployeePayslips(user?.employee_id, isEmployee);
  const createMutation = useCreatePayrollBatch();
  const processMutation = useProcessPayrollBatch();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<BatchForm>({
    resolver: zodResolver(batchSchema),
    defaultValues: {
      cycle: 'monthly',
    },
  });

  const onSubmit = (data: BatchForm) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        setIsModalOpen(false);
        reset();
      },
    });
  };

  const handleProcess = () => {
    if (!selectedBatch) return;
    processMutation.mutate(selectedBatch.id, {
      onSuccess: () => {
        setIsProcessModalOpen(false);
        setSelectedBatch(null);
      },
    });
  };

  if (batchesQuery.isLoading || payslipsQuery.isLoading) return <Loader fullPage />;

  if (!isEmployee && batchesQuery.isError) {
    return <ErrorState message={(batchesQuery.error as any).error || 'Failed to load payroll batches'} onRetry={batchesQuery.refetch} />;
  }
  if (isEmployee && payslipsQuery.isError) {
    return <ErrorState message={(payslipsQuery.error as any).error || 'Failed to load payslips'} onRetry={payslipsQuery.refetch} />;
  }

  const payslips = useMemo(
    () => [...(payslipsQuery.data ?? [])].sort((a, b) => new Date(b.generated_at ?? 0).getTime() - new Date(a.generated_at ?? 0).getTime()),
    [payslipsQuery.data]
  );
  const batches = batchesQuery.data ?? [];
  const latestPayslip = payslips[0];
  const totalNet = payslips.reduce((sum, payslip) => sum + Number(payslip.net), 0);

  if (isEmployee) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Payslips</h1>
          <p className="text-slate-500">Review your latest salary statements and payroll history.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Total Payslips</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">{payslips.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Latest Net Pay</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {latestPayslip ? formatCurrency(latestPayslip.net) : 'No payslip'}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Total Net Received</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">{formatCurrency(totalNet)}</p>
          </div>
        </div>

        {payslips.length === 0 ? (
          <EmptyState
            title="No payslips yet"
            description="Payroll records will appear here after your first processed batch."
            icon={Wallet}
          />
        ) : (
          <Table headers={['Batch', 'Generated', 'Gross', 'Deductions', 'Net', 'Status']}>
            {payslips.map((payslip) => (
              <TableRow key={payslip.id}>
                <TableCell className="font-medium text-slate-900">Batch #{payslip.batch_id}</TableCell>
                <TableCell>{payslip.generated_at ? formatDate(payslip.generated_at) : 'Recently generated'}</TableCell>
                <TableCell>{formatCurrency(payslip.gross)}</TableCell>
                <TableCell className="text-rose-700">{formatCurrency(payslip.deductions)}</TableCell>
                <TableCell className="font-medium text-emerald-700">{formatCurrency(payslip.net)}</TableCell>
                <TableCell>
                  <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium capitalize text-slate-700">
                    {payslip.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </Table>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payroll Management</h1>
          <p className="text-slate-500">Create payroll batches and process salary runs for active employees.</p>
        </div>
        {hasPermission('payroll.create') && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Batch
          </Button>
        )}
      </div>

      {!batches.length ? (
        <EmptyState
          title="No payroll batches"
          description="Create your first payroll batch to start processing salaries."
          icon={Wallet}
          action={hasPermission('payroll.create') && <Button onClick={() => setIsModalOpen(true)}>New Batch</Button>}
        />
      ) : (
        <Table headers={['Batch Name', 'Cycle', 'Period', 'Status', 'Actions']}>
          {batches.map((batch) => (
            <TableRow key={batch.id}>
              <TableCell className="font-medium text-slate-900">{batch.name}</TableCell>
              <TableCell className="capitalize">{batch.cycle}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Calendar className="h-3 w-3" />
                  {formatDate(batch.period_start)} - {formatDate(batch.period_end)}
                </div>
              </TableCell>
              <TableCell>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  batch.status === 'processed' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {batch.status}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {batch.status === 'draft' && hasPermission('payroll.process') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-indigo-600 hover:text-indigo-700"
                      onClick={() => {
                        setSelectedBatch(batch);
                        setIsProcessModalOpen(true);
                      }}
                    >
                      <Play className="mr-1 h-4 w-4" />
                      Process
                    </Button>
                  )}
                  {batch.status === 'processed' && hasPermission('payslip.view') && (
                    <span className="inline-flex items-center text-xs font-medium text-slate-500">
                      <FileText className="mr-1 h-4 w-4" />
                      Payslips generated
                    </span>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </Table>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Payroll Batch">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Batch Name" placeholder="e.g. April 2026 Payroll" {...register('name')} error={errors.name?.message} />
          <Select
            label="Payroll Cycle"
            options={[
              { label: 'Monthly', value: 'monthly' },
              { label: 'Semi-Monthly', value: 'semi-monthly' },
            ]}
            {...register('cycle')}
            error={errors.cycle?.message}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Period Start" type="date" {...register('period_start')} error={errors.period_start?.message} />
            <Input label="Period End" type="date" {...register('period_end')} error={errors.period_end?.message} />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={createMutation.isPending}>Create Batch</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isProcessModalOpen} onClose={() => setIsProcessModalOpen(false)} title="Process Payroll Batch">
        <div className="space-y-4">
          <div className="flex gap-3 rounded-lg border border-amber-100 bg-amber-50 p-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
            <p className="text-sm text-amber-700">
              Processing this batch generates payslips for active employees in the local payroll cache and cannot be undone.
            </p>
          </div>
          <p className="text-sm text-slate-600">
            Are you sure you want to process <span className="font-bold text-slate-900">{selectedBatch?.name}</span>?
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsProcessModalOpen(false)}>Cancel</Button>
            <Button onClick={handleProcess} isLoading={processMutation.isPending}>Confirm & Process</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
