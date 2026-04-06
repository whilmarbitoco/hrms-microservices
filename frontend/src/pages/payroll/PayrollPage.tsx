import { useState } from 'react';
import { usePayrollBatches, useCreatePayrollBatch, useProcessPayrollBatch } from '../../hooks/usePayroll';
import { Table, TableRow, TableCell } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Loader } from '../../components/ui/Loader';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Plus, Wallet, Play, FileText, Calendar, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../lib/utils';
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
  const { hasPermission } = useAuth();
  const { data: batches, isLoading, isError, error, refetch } = usePayrollBatches();
  const createMutation = useCreatePayrollBatch();
  const processMutation = useProcessPayrollBatch();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<BatchForm>({
    resolver: zodResolver(batchSchema),
    defaultValues: {
      cycle: 'monthly',
    }
  });

  const onSubmit = (data: BatchForm) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        setIsModalOpen(false);
        reset();
      }
    });
  };

  const handleProcess = () => {
    if (!selectedBatch) return;
    processMutation.mutate(selectedBatch.id, {
      onSuccess: () => {
        setIsProcessModalOpen(false);
        setSelectedBatch(null);
      }
    });
  };

  if (isLoading) return <Loader fullPage />;
  if (isError) return <ErrorState message={(error as any).error || 'Failed to load payroll batches'} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payroll Management</h1>
          <p className="text-slate-500">Create and process payroll batches for your employees.</p>
        </div>
        {hasPermission('payroll.create') && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Batch
          </Button>
        )}
      </div>

      {!batches || batches.length === 0 ? (
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
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
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
                      <Play className="h-4 w-4 mr-1" />
                      Process
                    </Button>
                  )}
                  {batch.status === 'processed' && hasPermission('payslip.view') && (
                    <Button variant="ghost" size="sm">
                      <FileText className="h-4 w-4 mr-1" />
                      Payslips
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </Table>
      )}

      {/* Create Batch Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Payroll Batch"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input 
            label="Batch Name" 
            placeholder="e.g. November 2024 Payroll" 
            {...register('name')}
            error={errors.name?.message}
          />
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
            <Input 
              label="Period Start" 
              type="date"
              {...register('period_start')}
              error={errors.period_start?.message}
            />
            <Input 
              label="Period End" 
              type="date"
              {...register('period_end')}
              error={errors.period_end?.message}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={createMutation.isPending}>Create Batch</Button>
          </div>
        </form>
      </Modal>

      {/* Process Confirmation Modal */}
      <Modal
        isOpen={isProcessModalOpen}
        onClose={() => setIsProcessModalOpen(false)}
        title="Process Payroll Batch"
      >
        <div className="space-y-4">
          <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-700">
              Processing this batch will compute salaries for all active employees and generate payslips. 
              This action cannot be undone.
            </p>
          </div>
          <p className="text-sm text-slate-600">
            Are you sure you want to process the <span className="font-bold text-slate-900">{selectedBatch?.name}</span>?
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsProcessModalOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleProcess}
              isLoading={processMutation.isPending}
            >
              Confirm & Process
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
