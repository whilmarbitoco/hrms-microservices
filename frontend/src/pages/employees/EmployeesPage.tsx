import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Edit2, Eye, Filter, Plus, Search, UserMinus, UserCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
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
import { useDepartments } from '../../hooks/useDepartments';
import { useCreateEmployee, useEmployees, useTerminateEmployee, useUpdateEmployee } from '../../hooks/useEmployees';
import { useEmployeeRoles } from '../../hooks/useEmployeeRoles';
import { formatDate } from '../../lib/utils';

const employeeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
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

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<EmployeeForm>({
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
      updateMutation.mutate(
        { id: selectedEmployee.id, payload },
        {
          onSuccess: () => {
            setIsModalOpen(false);
            setSelectedEmployee(null);
            reset();
          },
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          setIsModalOpen(false);
          reset();
        },
      });
    }
  };

  const handleEdit = (employee: any) => {
    setSelectedEmployee(employee);
    setValue('name', employee.name);
    setValue('email', employee.email);
    setValue('phone', employee.phone || '');
    setValue('department_id', employee.department?.id?.toString() || '');
    setValue('role_id', employee.role?.id?.toString() || '');
    setValue('manager_id', employee.manager_id?.toString() || '');
    setValue('hired_at', employee.hired_at ? new Date(employee.hired_at).toISOString().split('T')[0] : '');
    setIsModalOpen(true);
  };

  const handleTerminate = () => {
    if (!selectedEmployee) return;
    terminateMutation.mutate(
      {
        id: selectedEmployee.id,
        reason: terminationReason,
      },
      {
        onSuccess: () => {
          setIsTerminateModalOpen(false);
          setTerminationReason('');
          setSelectedEmployee(null);
        },
      }
    );
  };

  if (isLoading) return <Loader fullPage />;
  if (isError) {
    return (
      <ErrorState
        title="Unable to load employees"
        message={(error as any).error || 'The employee directory could not be synchronized.'}
        onRetry={refetch}
      />
    );
  }

  const openCreateModal = () => {
    setSelectedEmployee(null);
    reset();
    setIsModalOpen(true);
  };

  return (
    <div className="page-shell">
      <header className="page-header">
        <div className="page-heading">
          <div className="page-eyebrow">
            <span>Workforce management</span>
            <span>/</span>
            <span>Employee directory</span>
          </div>
          <h1 className="page-title">Employees</h1>
          <p className="page-subtitle">
            Maintain employee records, review role and department assignments, and manage status
            updates from a single corporate workspace.
          </p>
        </div>
        {hasPermission('employee.create') && (
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4" />
            Add employee
          </Button>
        )}
      </header>

      <section className="toolbar">
        <div className="toolbar-grid items-end">
          <Input
            label="Search employees"
            placeholder="Search by employee name"
            icon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            label="Department"
            options={[
              { label: 'All departments', value: '' },
              ...(departments?.map((department) => ({
                label: department.name,
                value: department.id.toString(),
              })) || []),
            ]}
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
          />
          <Button variant="outline">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>
      </section>

      <section className="section-card">
        <div className="section-header">
          <div>
            <h2 className="section-title">Employee records</h2>
            <p className="section-description">
              {employees?.length ?? 0} employee record(s) match the current filters.
            </p>
          </div>
        </div>

        {!employees || employees.length === 0 ? (
          <EmptyState
            title="No employees found"
            description="Adjust your search or add a new employee record to populate the directory."
            icon={UserCircle}
            action={
              hasPermission('employee.create') ? (
                <Button variant="outline" onClick={openCreateModal}>
                  Add employee
                </Button>
              ) : null
            }
          />
        ) : (
          <Table
            headers={['Employee', 'Department', 'Role', 'Status', 'Hire date', 'Actions']}
          >
            {employees.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell>
                  <div className="flex items-center gap-4">
                    <div className="rounded-2xl border border-border-base bg-paper-sunken p-3">
                      <UserCircle className="h-5 w-5 text-accent-base" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink-base">{employee.name}</p>
                      <p className="truncate text-sm text-ink-muted">{employee.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-ink-muted">
                  {employee.department?.name || 'Not assigned'}
                </TableCell>
                <TableCell className="text-sm text-ink-muted">
                  {employee.role?.name || 'Not assigned'}
                </TableCell>
                <TableCell>
                  <span
                    className={
                      employee.status === 'active'
                        ? 'status-badge status-badge-success'
                        : 'status-badge status-badge-danger'
                    }
                  >
                    {employee.status}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-ink-muted">
                  {employee.hired_at ? formatDate(employee.hired_at) : 'Not set'}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {hasPermission('employee.view') && (
                      <Link to={`/employees/${employee.id}`}>
                        <Button variant="ghost" size="sm" title="View employee">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                    {hasPermission('employee.update') && (
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(employee)} title="Edit employee">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                    {employee.status === 'active' && hasPermission('employee.terminate') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-error-base hover:bg-error-base hover:text-white"
                        onClick={() => {
                          setSelectedEmployee(employee);
                          setIsTerminateModalOpen(true);
                        }}
                        title="Terminate employee"
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </Table>
        )}
      </section>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedEmployee ? 'Edit employee' : 'Add employee'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-5 md:grid-cols-2">
            <Input
              label="Full name"
              placeholder="e.g. Marcus Aurelius"
              {...register('name')}
              error={errors.name?.message}
            />
            <Input
              label="Email address"
              type="email"
              placeholder="name@company.com"
              {...register('email')}
              error={errors.email?.message}
            />
            <Input
              label="Phone number"
              placeholder="+63 900 000 0000"
              {...register('phone')}
              error={errors.phone?.message}
            />
            <Input
              label="Hire date"
              type="date"
              {...register('hired_at')}
              error={errors.hired_at?.message}
            />
            <Select
              label="Department"
              options={[
                { label: 'Select department', value: '' },
                ...(departments?.map((department) => ({
                  label: department.name,
                  value: department.id.toString(),
                })) || []),
              ]}
              {...register('department_id')}
              error={errors.department_id?.message}
            />
            <Select
              label="Role"
              options={[
                { label: 'Select role', value: '' },
                ...(roles?.map((role) => ({
                  label: role.name,
                  value: role.id.toString(),
                })) || []),
              ]}
              {...register('role_id')}
              error={errors.role_id?.message}
            />
          </div>
          <div className="flex justify-end gap-3 border-t border-border-faint pt-5">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
              {selectedEmployee ? 'Save changes' : 'Create employee'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isTerminateModalOpen}
        onClose={() => setIsTerminateModalOpen(false)}
        title="Terminate employee"
      >
        <div className="space-y-6">
          <div className="info-strip border-error-base/20 bg-error-base/5 text-ink-muted">
            <UserMinus className="mt-0.5 h-5 w-5 shrink-0 text-error-base" />
            <div>
              <p className="font-semibold text-ink-base">This action will mark the employee as inactive.</p>
              <p className="mt-1 leading-7">
                Access and active employment status for <span className="font-semibold text-ink-base">{selectedEmployee?.name}</span> will be revoked.
              </p>
            </div>
          </div>
          <Input
            label="Termination reason"
            placeholder="Enter a brief reason"
            value={terminationReason}
            onChange={(e) => setTerminationReason(e.target.value)}
            required
          />
          <div className="flex justify-end gap-3 border-t border-border-faint pt-5">
            <Button variant="ghost" onClick={() => setIsTerminateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleTerminate}
              isLoading={terminateMutation.isPending}
              disabled={!terminationReason}
            >
              Confirm termination
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
