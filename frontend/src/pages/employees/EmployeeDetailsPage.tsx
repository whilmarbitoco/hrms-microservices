import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEmployee, useEmployeeHistory } from '../../hooks/useEmployees';
import { useSalaryComponents, useCreateSalaryComponent, useUpdateSalaryComponent, useDeleteSalaryComponent } from '../../hooks/usePayroll';
import { useAuth } from '../../context/AuthContext';
import { Loader } from '../../components/ui/Loader';
import { ErrorState } from '../../components/ui/ErrorState';
import { Button } from '../../components/ui/Button';
import { Table, TableRow, TableCell } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { 
  User, 
  History, 
  Wallet, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Edit2,
  Calendar,
  Phone,
  Mail,
  Building2,
  Briefcase,
  UserCircle
} from 'lucide-react';
import { formatDate, cn } from '../../lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const salarySchema = z.object({
  type: z.enum(['base', 'allowance', 'deduction']),
  name: z.string().min(2, 'Name is required'),
  amount: z.string().min(1, 'Amount is required'),
});

type SalaryForm = z.infer<typeof salarySchema>;

export default function EmployeeDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'history' | 'salary'>('profile');

  const { data: employee, isLoading: isEmpLoading, isError: isEmpError, error: empError } = useEmployee(id!);
  const { data: history, isLoading: isHistoryLoading } = useEmployeeHistory(id!);
  const { data: salaryComponents, isLoading: isSalaryLoading } = useSalaryComponents(employee?.employee_id);

  const createSalaryMutation = useCreateSalaryComponent();
  const updateSalaryMutation = useUpdateSalaryComponent();
  const deleteSalaryMutation = useDeleteSalaryComponent();

  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<any>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<SalaryForm>({
    resolver: zodResolver(salarySchema),
  });

  const onSalarySubmit = (data: SalaryForm) => {
    if (selectedComponent) {
      updateSalaryMutation.mutate({ id: selectedComponent.id, payload: data }, {
        onSuccess: () => {
          setIsSalaryModalOpen(false);
          setSelectedComponent(null);
          reset();
        }
      });
    } else {
      createSalaryMutation.mutate({ ...data, employee_id: employee?.employee_id }, {
        onSuccess: () => {
          setIsSalaryModalOpen(false);
          reset();
        }
      });
    }
  };

  const handleEditSalary = (comp: any) => {
    setSelectedComponent(comp);
    setValue('type', comp.type);
    setValue('name', comp.name);
    setValue('amount', comp.amount);
    setIsSalaryModalOpen(true);
  };

  if (isEmpLoading) return <Loader fullPage />;
  if (isEmpError) return <ErrorState message={(empError as any).error || 'Failed to load employee'} onRetry={() => navigate('/employees')} />;
  if (!employee) return <ErrorState message="Employee not found" onRetry={() => navigate('/employees')} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/employees')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Directory
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 p-8 text-white">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            <div className="h-24 w-24 rounded-full bg-slate-800 flex items-center justify-center border-4 border-slate-700">
              <UserCircle className="h-16 w-16 text-slate-500" />
            </div>
            <div className="text-center md:text-left space-y-2">
              <h1 className="text-3xl font-bold">{employee.name}</h1>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 text-slate-400 text-sm">
                <span className="flex items-center gap-1.5"><Mail className="h-4 w-4" /> {employee.email}</span>
                {employee.phone && <span className="flex items-center gap-1.5"><Phone className="h-4 w-4" /> {employee.phone}</span>}
                <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> Hired {formatDate(employee.hired_at)}</span>
              </div>
              <div className="flex gap-2 pt-2">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-medium border border-indigo-500/30">
                  {employee.employee_id}
                </span>
                <span className={cn(
                  "px-2.5 py-0.5 rounded-full text-xs font-medium border",
                  employee.status === 'active' 
                    ? "bg-green-500/20 text-green-300 border-green-500/30" 
                    : "bg-red-500/20 text-red-300 border-red-500/30"
                )}>
                  {employee.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-slate-200">
          <div className="flex px-6">
            <button
              onClick={() => setActiveTab('profile')}
              className={cn(
                "px-4 py-4 text-sm font-medium border-b-2 transition-colors",
                activeTab === 'profile' ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"
              )}
            >
              <User className="h-4 w-4 inline mr-2" />
              Profile
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={cn(
                "px-4 py-4 text-sm font-medium border-b-2 transition-colors",
                activeTab === 'history' ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"
              )}
            >
              <History className="h-4 w-4 inline mr-2" />
              History
            </button>
            {hasPermission('payroll.view') && (
              <button
                onClick={() => setActiveTab('salary')}
                className={cn(
                  "px-4 py-4 text-sm font-medium border-b-2 transition-colors",
                  activeTab === 'salary' ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"
                )}
              >
                <Wallet className="h-4 w-4 inline mr-2" />
                Salary Config
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Organizational Info</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg"><Building2 className="h-4 w-4 text-slate-600" /></div>
                    <div>
                      <p className="text-xs text-slate-500">Department</p>
                      <p className="text-sm font-medium text-slate-900">{employee.department?.name || 'Not Assigned'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg"><Briefcase className="h-4 w-4 text-slate-600" /></div>
                    <div>
                      <p className="text-xs text-slate-500">Role</p>
                      <p className="text-sm font-medium text-slate-900">{employee.role?.name || 'Not Assigned'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg"><User className="h-4 w-4 text-slate-600" /></div>
                    <div>
                      <p className="text-xs text-slate-500">Reports To</p>
                      <p className="text-sm font-medium text-slate-900">{employee.manager_id ? `Employee #${employee.manager_id}` : 'No Manager'}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Personal Info</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg"><Mail className="h-4 w-4 text-slate-600" /></div>
                    <div>
                      <p className="text-xs text-slate-500">Email Address</p>
                      <p className="text-sm font-medium text-slate-900">{employee.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg"><Phone className="h-4 w-4 text-slate-600" /></div>
                    <div>
                      <p className="text-xs text-slate-500">Phone Number</p>
                      <p className="text-sm font-medium text-slate-900">{employee.phone || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-6">
              {isHistoryLoading ? <Loader /> : (
                <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {history?.map((event: any, idx: number) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[27px] top-1.5 h-4 w-4 rounded-full bg-white border-2 border-indigo-500" />
                      <div>
                        <p className="text-sm font-bold text-slate-900 capitalize">{event.action.replace('.', ' ')}</p>
                        <p className="text-xs text-slate-500 mb-2">{formatDate(event.created_at)}</p>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-600">
                          <pre className="whitespace-pre-wrap font-sans">{JSON.stringify(event.metadata_ ?? {}, null, 2)}</pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'salary' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Salary Components</h3>
                <Button size="sm" onClick={() => {
                  setSelectedComponent(null);
                  reset();
                  setIsSalaryModalOpen(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Component
                </Button>
              </div>

              {isSalaryLoading ? <Loader /> : (
                <Table headers={['Name', 'Type', 'Amount', 'Actions']}>
                  {salaryComponents?.map((comp) => (
                    <TableRow key={comp.id}>
                      <TableCell className="font-medium text-slate-900">{comp.name}</TableCell>
                      <TableCell>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                          comp.type === 'base' && "bg-blue-100 text-blue-700",
                          comp.type === 'allowance' && "bg-green-100 text-green-700",
                          comp.type === 'deduction' && "bg-red-100 text-red-700"
                        )}>
                          {comp.type}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono">${Number(comp.amount).toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEditSalary(comp)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700"
                            onClick={() => {
                              if (confirm('Remove this salary component?')) {
                                deleteSalaryMutation.mutate(comp.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {salaryComponents?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-slate-500 italic">
                        No salary components configured for this employee.
                      </TableCell>
                    </TableRow>
                  )}
                </Table>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Salary Modal */}
      <Modal
        isOpen={isSalaryModalOpen}
        onClose={() => setIsSalaryModalOpen(false)}
        title={selectedComponent ? 'Edit Salary Component' : 'Add Salary Component'}
      >
        <form onSubmit={handleSubmit(onSalarySubmit)} className="space-y-4">
          <Select 
            label="Component Type"
            options={[
              { label: 'Base Salary', value: 'base' },
              { label: 'Allowance', value: 'allowance' },
              { label: 'Deduction', value: 'deduction' },
            ]}
            {...register('type')}
            error={errors.type?.message}
          />
          <Input 
            label="Component Name" 
            placeholder="e.g. Housing Allowance" 
            {...register('name')}
            error={errors.name?.message}
          />
          <Input 
            label="Amount" 
            type="number"
            step="0.01"
            placeholder="0.00" 
            {...register('amount')}
            error={errors.amount?.message}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsSalaryModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={createSalaryMutation.isPending || updateSalaryMutation.isPending}>
              {selectedComponent ? 'Update' : 'Save'} Component
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
