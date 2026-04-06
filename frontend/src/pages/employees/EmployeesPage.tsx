import { useState } from 'react';
import { useEmployees, useCreateEmployee, useUpdateEmployee, useTerminateEmployee } from '../../hooks/useEmployees';
import { useDepartments } from '../../hooks/useDepartments';
import { useEmployeeRoles } from '../../hooks/useEmployeeRoles';
import { Table, TableRow, TableCell } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Loader } from '../../components/ui/Loader';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Plus, Search, Filter, UserMinus, History, MoreHorizontal, Edit2, Eye } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';

const employeeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  department_id: z.string().optional(),
  role_id: z.string().optional(),
  manager_id: z.string().optional(),
  hired_at: z.string().min(1, 'Hire date is required'),
});

type EmployeeForm = z.infer<typeof employeeSchema>;

export default function EmployeesPage() {
  const { hasPermission } = useAuth();
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  
  const { data: employees, isLoading, isError, error, refetch } = useEmployees({
    name: search || undefined,
    department_id: deptFilter || undefined,
  });
  
  const { data: departments } = useDepartments();
  const { data: roles } = useEmployeeRoles();
  
  const createMutation = useCreateEmployee();
  const updateMutation = useUpdateEmployee();
  const terminateMutation = useTerminateEmployee();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTerminateModalOpen, setIsTerminateModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [terminationReason, setTerminationReason] = useState('');

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<EmployeeForm>({
    resolver: zodResolver(employeeSchema),
  });

  const onSubmit = (data: EmployeeForm) => {
    const payload = {
      ...data,
      department_id: data.department_id ? Number(data.department_id) : undefined,
      role_id: data.role_id ? Number(data.role_id) : undefined,
      manager_id: data.manager_id ? Number(data.manager_id) : undefined,
    };

    if (selectedEmployee) {
      updateMutation.mutate({ id: selectedEmployee.id, payload }, {
        onSuccess: () => {
          setIsModalOpen(false);
          setSelectedEmployee(null);
          reset();
        }
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          setIsModalOpen(false);
          reset();
        }
      });
    }
  };

  const handleEdit = (emp: any) => {
    setSelectedEmployee(emp);
    setValue('name', emp.name);
    setValue('email', emp.email);
    setValue('phone', emp.phone || '');
    setValue('department_id', emp.department?.id?.toString() || '');
    setValue('role_id', emp.role?.id?.toString() || '');
    setValue('manager_id', emp.manager_id?.toString() || '');
    setValue('hired_at', emp.hired_at ? new Date(emp.hired_at).toISOString().split('T')[0] : '');
    setIsModalOpen(true);
  };

  const handleTerminate = () => {
    if (!selectedEmployee) return;
    terminateMutation.mutate({
      id: selectedEmployee.id,
      reason: terminationReason
    }, {
      onSuccess: () => {
        setIsTerminateModalOpen(false);
        setTerminationReason('');
        setSelectedEmployee(null);
      }
    });
  };

  if (isLoading) return <Loader fullPage />;
  if (isError) return <ErrorState message={(error as any).error || 'Failed to load employees'} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Employees</h1>
          <p className="text-slate-500">Manage your workforce and employee lifecycles.</p>
        </div>
        {hasPermission('employee.create') && (
          <Button onClick={() => {
            setSelectedEmployee(null);
            reset();
            setIsModalOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search by name..."
            className="w-full pl-10 pr-4 py-2 rounded-md border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full md:w-48">
          <Select 
            options={[
              { label: 'All Departments', value: '' },
              ...(departments?.map(d => ({ label: d.name, value: d.id.toString() })) || [])
            ]}
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="h-9"
          />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="mr-2 h-4 w-4" />
          More Filters
        </Button>
      </div>

      {!employees || employees.length === 0 ? (
        <EmptyState 
          title="No employees found" 
          description="Try adjusting your search or filters."
          action={hasPermission('employee.create') && <Button onClick={() => setIsModalOpen(true)}>Add Employee</Button>}
        />
      ) : (
        <Table headers={['ID', 'Name', 'Department', 'Role', 'Status', 'Hired At', 'Actions']}>
          {employees.map((emp) => (
            <TableRow key={emp.id}>
              <TableCell className="text-xs font-mono text-slate-500">{emp.employee_id}</TableCell>
              <TableCell>
                <div>
                  <p className="font-medium text-slate-900">{emp.name}</p>
                  <p className="text-xs text-slate-500">{emp.email}</p>
                </div>
              </TableCell>
              <TableCell>{emp.department?.name || '-'}</TableCell>
              <TableCell>{emp.role?.name || '-'}</TableCell>
              <TableCell>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  emp.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {emp.status}
                </span>
              </TableCell>
              <TableCell>{formatDate(emp.hired_at)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {hasPermission('employee.view') && (
                    <Link to={`/employees/${emp.id}`}>
                      <Button variant="ghost" size="sm" title="View Details">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                  {hasPermission('employee.update') && (
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(emp)} title="Edit Employee">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  )}
                  {hasPermission('employee.view') && (
                    <Button variant="ghost" size="sm" title="View History">
                      <History className="h-4 w-4" />
                    </Button>
                  )}
                  {emp.status === 'active' && hasPermission('employee.terminate') && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700"
                      onClick={() => {
                        setSelectedEmployee(emp);
                        setIsTerminateModalOpen(true);
                      }}
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </Table>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedEmployee ? 'Edit Employee' : 'Add New Employee'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Full Name" 
              placeholder="John Doe" 
              {...register('name')}
              error={errors.name?.message}
            />
            <Input 
              label="Email Address" 
              type="email"
              placeholder="john@example.com" 
              {...register('email')}
              error={errors.email?.message}
            />
            <Input 
              label="Phone Number" 
              placeholder="+1234567890" 
              {...register('phone')}
              error={errors.phone?.message}
            />
            <Input 
              label="Hire Date" 
              type="date"
              {...register('hired_at')}
              error={errors.hired_at?.message}
            />
            <Select 
              label="Department"
              options={[
                { label: 'Select Department', value: '' },
                ...(departments?.map(d => ({ label: d.name, value: d.id.toString() })) || [])
              ]}
              {...register('department_id')}
              error={errors.department_id?.message}
            />
            <Select 
              label="Role"
              options={[
                { label: 'Select Role', value: '' },
                ...(roles?.map(r => ({ label: r.name, value: r.id.toString() })) || [])
              ]}
              {...register('role_id')}
              error={errors.role_id?.message}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
              {selectedEmployee ? 'Update' : 'Create'} Employee
            </Button>
          </div>
        </form>
      </Modal>

      {/* Termination Modal */}
      <Modal
        isOpen={isTerminateModalOpen}
        onClose={() => setIsTerminateModalOpen(false)}
        title={`Terminate Employee: ${selectedEmployee?.name}`}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to terminate this employee? This action will change their status to terminated.
          </p>
          <Input 
            label="Reason for Termination" 
            placeholder="e.g. Voluntary resignation" 
            value={terminationReason}
            onChange={(e) => setTerminationReason(e.target.value)}
            required
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsTerminateModalOpen(false)}>Cancel</Button>
            <Button 
              variant="danger" 
              onClick={handleTerminate}
              isLoading={terminateMutation.isPending}
              disabled={!terminationReason}
            >
              Confirm Termination
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
