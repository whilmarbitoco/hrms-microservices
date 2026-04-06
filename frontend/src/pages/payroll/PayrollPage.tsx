import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Calendar, FileText, Play, Plus, Wallet } from 'lucide-react';
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
  useCreatePayrollBatch,
  useEmployeePayslips,
  usePayrollBatches,
  useProcessPayrollBatch,
} from '../../hooks/usePayroll';
import { formatCurrency, formatDate } from '../../lib/utils';

const batchSchema = z.object({
  name: z.string().min(2, 'Batch name must be at least 2 characters'),
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

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BatchForm>({
    resolver: zodResolver(batchSchema),
    defaultValues: {
      cycle: 'monthly',
    },
  });

  const payslips = useMemo(
    () =>
      [...(payslipsQuery.data ?? [])].sort(
        (a, b) => new Date(b.generated_at ?? 0).getTime() - new Date(a.generated_at ?? 0).getTime()
      ),
    [payslipsQuery.data]
  );

  const batches = useMemo(() => batchesQuery.data ?? [], [batchesQuery.data]);
  const latestPayslip = payslips[0];
  const totalNet = payslips.reduce((sum, payslip) => sum + Number(payslip.net), 0);

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
    return (
      <ErrorState
        title="Unable to load payroll batches"
        message={(batchesQuery.error as any).error || 'The payroll batch workspace could not be synchronized.'}
        onRetry={batchesQuery.refetch}
      />
    );
  }

  if (isEmployee && payslipsQuery.isError) {
    return (
      <ErrorState
        title="Unable to load payslips"
        message={(payslipsQuery.error as any).error || 'Your payslip history could not be synchronized.'}
        onRetry={payslipsQuery.refetch}
      />
    );
  }

  if (isEmployee) {
    return (
      <div className="page-shell">
        <header className="page-header">
          <div className="page-heading">
            <div className="page-eyebrow">
              <span>Payroll</span>
              <span>/</span>
              <span>Self service</span>
            </div>
            <h1 className="page-title">Payroll history</h1>
            <p className="page-subtitle">
              Review your payslip records, latest net pay, and cumulative payroll history.
            </p>
          </div>
        </header>

        <section className="metric-grid">
          <div className="metric-card">
            <p className="metric-label">Payslips</p>
            <p className="metric-value">{payslips.length}</p>
            <p className="metric-meta">Generated payroll records</p>
          </div>
          <div className="metric-card">
            <p className="metric-label">Latest net pay</p>
            <p className="metric-value">{latestPayslip ? formatCurrency(latestPayslip.net) : 'No record'}</p>
            <p className="metric-meta">Most recent payslip total</p>
          </div>
          <div className="metric-card">
            <p className="metric-label">Total net pay</p>
            <p className="metric-value">{formatCurrency(totalNet)}</p>
            <p className="metric-meta">Combined net pay across all payslips</p>
          </div>
        </section>

        <section className="section-card">
          <div className="section-header">
            <div>
              <h2 className="section-title">Payslip records</h2>
              <p className="section-description">Historical payroll details for your account.</p>
            </div>
          </div>

          {payslips.length === 0 ? (
            <EmptyState
              title="No payslips available"
              description="Your payroll history will appear here after payroll is processed."
              icon={Wallet}
            />
          ) : (
            <Table headers={['Batch', 'Generated on', 'Gross pay', 'Deductions', 'Net pay', 'Status']}>
              {payslips.map((payslip) => (
                <TableRow key={payslip.id}>
                  <TableCell className="text-sm font-semibold text-ink-base">Batch #{payslip.batch_id}</TableCell>
                  <TableCell className="text-sm text-ink-muted">
                    {payslip.generated_at ? formatDate(payslip.generated_at) : 'Pending'}
                  </TableCell>
                  <TableCell className="text-sm text-ink-base">{formatCurrency(payslip.gross)}</TableCell>
                  <TableCell className="text-sm text-error-base">-{formatCurrency(payslip.deductions)}</TableCell>
                  <TableCell className="text-sm font-semibold text-accent-base">{formatCurrency(payslip.net)}</TableCell>
                  <TableCell>
                    <span className="status-badge status-badge-neutral">{payslip.status}</span>
                  </TableCell>
                </TableRow>
              ))}
            </Table>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <header className="page-header">
        <div className="page-heading">
          <div className="page-eyebrow">
            <span>Payroll operations</span>
            <span>/</span>
            <span>Batch management</span>
          </div>
          <h1 className="page-title">Payroll batches</h1>
          <p className="page-subtitle">
            Create payroll runs, process draft batches, and monitor payroll execution from one
            operational workspace.
          </p>
        </div>
        {hasPermission('payroll.create') && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4" />
            New payroll batch
          </Button>
        )}
      </header>

      <section className="section-card">
        <div className="section-header">
          <div>
            <h2 className="section-title">Batch queue</h2>
            <p className="section-description">
              {batches.length} payroll batch(es) are currently available.
            </p>
          </div>
        </div>

        {!batches.length ? (
          <EmptyState
            title="No payroll batches found"
            description="Create a payroll batch to start a new salary processing cycle."
            icon={Wallet}
            action={
              hasPermission('payroll.create') ? (
                <Button variant="outline" onClick={() => setIsModalOpen(true)}>
                  New payroll batch
                </Button>
              ) : null
            }
          />
        ) : (
          <Table headers={['Batch', 'Cycle', 'Period', 'Status', 'Actions']}>
            {batches.map((batch) => (
              <TableRow key={batch.id}>
                <TableCell className="text-sm font-semibold text-ink-base">{batch.name}</TableCell>
                <TableCell className="text-sm text-ink-muted">{batch.cycle}</TableCell>
                <TableCell className="text-sm text-ink-muted">
                  {formatDate(batch.period_start)} to {formatDate(batch.period_end)}
                </TableCell>
                <TableCell>
                  <span
                    className={
                      batch.status === 'processed'
                        ? 'status-badge status-badge-success'
                        : 'status-badge status-badge-warning'
                    }
                  >
                    {batch.status}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {batch.status === 'draft' && hasPermission('payroll.process') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-accent-base hover:bg-accent-base hover:text-white"
                        onClick={() => {
                          setSelectedBatch(batch);
                          setIsProcessModalOpen(true);
                        }}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                    {batch.status === 'processed' && (
                      <span className="inline-flex items-center gap-2 text-sm text-ink-muted">
                        <FileText className="h-4 w-4" />
                        Payslips generated
                      </span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </Table>
        )}
      </section>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New payroll batch">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Input label="Batch name" placeholder="e.g. April 2026 Monthly Payroll" {...register('name')} error={errors.name?.message} />
          <Select
            label="Cycle"
            options={[
              { label: 'Monthly', value: 'monthly' },
              { label: 'Semi-monthly', value: 'semi-monthly' },
            ]}
            {...register('cycle')}
            error={errors.cycle?.message}
          />
          <div className="grid gap-5 md:grid-cols-2">
            <Input label="Period start" type="date" {...register('period_start')} error={errors.period_start?.message} />
            <Input label="Period end" type="date" {...register('period_end')} error={errors.period_end?.message} />
          </div>
          <div className="flex justify-end gap-3 border-t border-border-faint pt-5">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Create batch
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isProcessModalOpen} onClose={() => setIsProcessModalOpen(false)} title="Process payroll batch">
        <div className="space-y-6">
          <div className="info-strip border-warning-base/20 bg-warning-base/10 text-ink-muted">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-warning-base" />
            <div>
              <p className="font-semibold text-ink-base">Processing generates final payslips.</p>
              <p className="mt-1 leading-7">
                This action creates payslips for eligible employees in the selected payroll period.
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-border-base bg-paper-sunken/25 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.18em] text-ink-muted">Selected batch</p>
            <p className="mt-2 text-lg font-semibold text-ink-base">{selectedBatch?.name}</p>
          </div>
          <div className="flex justify-end gap-3 border-t border-border-faint pt-5">
            <Button variant="ghost" onClick={() => setIsProcessModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleProcess} isLoading={processMutation.isPending}>
              Process payroll
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
