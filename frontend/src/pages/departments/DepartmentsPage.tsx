import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, Building2, Edit2, Plus, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Input } from '../../components/ui/Input';
import { Loader } from '../../components/ui/Loader';
import { Modal } from '../../components/ui/Modal';
import { Table, TableCell, TableRow } from '../../components/ui/Table';
import { useAuth } from '../../context/AuthContext';
import {
  useCreateDepartment,
  useDeleteDepartment,
  useDepartments,
  useUpdateDepartment,
} from '../../hooks/useDepartments';

const departmentSchema = z.object({
  name: z.string().min(2, 'Department name must be at least 2 characters'),
  description: z.string().optional(),
  manager_id: z.string().optional(),
});

type DepartmentForm = z.infer<typeof departmentSchema>;

export default function DepartmentsPage() {
  const { hasPermission } = useAuth();
  const { data: departments, isLoading, isError, error, refetch } = useDepartments();
  const createMutation = useCreateDepartment();
  const updateMutation = useUpdateDepartment();
  const deleteMutation = useDeleteDepartment();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<any>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<DepartmentForm>({
    resolver: zodResolver(departmentSchema),
  });

  const onSubmit = (data: DepartmentForm) => {
    const payload = {
      ...data,
      manager_id: data.manager_id ? Number(data.manager_id) : undefined,
    };

    if (selectedDepartment) {
      updateMutation.mutate(
        { id: selectedDepartment.id, payload },
        {
          onSuccess: () => {
            setIsModalOpen(false);
            setSelectedDepartment(null);
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

  const handleEdit = (department: any) => {
    setSelectedDepartment(department);
    setValue('name', department.name);
    setValue('description', department.description || '');
    setValue('manager_id', department.manager_id?.toString() || '');
    setIsModalOpen(true);
  };

  const handleDelete = () => {
    if (!selectedDepartment) return;
    deleteMutation.mutate(selectedDepartment.id, {
      onSuccess: () => {
        setIsDeleteModalOpen(false);
        setSelectedDepartment(null);
      },
    });
  };

  if (isLoading) return <Loader fullPage />;
  if (isError) {
    return (
      <ErrorState
        title="Unable to load departments"
        message={(error as any).error || 'The department directory could not be synchronized.'}
        onRetry={refetch}
      />
    );
  }

  const openCreateModal = () => {
    setSelectedDepartment(null);
    reset();
    setIsModalOpen(true);
  };

  return (
    <div className="page-shell">
      <header className="page-header">
        <div className="page-heading">
          <div className="page-eyebrow">
            <span>Organization</span>
            <span>/</span>
            <span>Departments</span>
          </div>
          <h1 className="page-title">Departments</h1>
          <p className="page-subtitle">
            Define the company structure, maintain department records, and monitor team population
            across the organization.
          </p>
        </div>
        {hasPermission('department.create') && (
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4" />
            Add department
          </Button>
        )}
      </header>

      <section className="section-card">
        <div className="section-header">
          <div>
            <h2 className="section-title">Department directory</h2>
            <p className="section-description">
              {departments?.length ?? 0} department record(s) are currently configured.
            </p>
          </div>
        </div>

        {!departments || departments.length === 0 ? (
          <EmptyState
            title="No departments yet"
            description="Create the first department to start building your organizational structure."
            icon={Building2}
            action={
              hasPermission('department.create') ? (
                <Button variant="outline" onClick={openCreateModal}>
                  Add department
                </Button>
              ) : null
            }
          />
        ) : (
          <Table headers={['Department', 'Description', 'Employees', 'Actions']}>
            {departments.map((department) => (
              <TableRow key={department.id}>
                <TableCell>
                  <p className="text-sm font-semibold text-ink-base">{department.name}</p>
                </TableCell>
                <TableCell className="max-w-md text-sm text-ink-muted">
                  {department.description || 'No description provided'}
                </TableCell>
                <TableCell>
                  <div className="text-sm font-semibold text-ink-base">{department.employee_count || 0}</div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {hasPermission('department.update') && (
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(department)} title="Edit department">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                    {hasPermission('department.delete') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-error-base hover:bg-error-base hover:text-white"
                        onClick={() => {
                          setSelectedDepartment(department);
                          setIsDeleteModalOpen(true);
                        }}
                        title="Delete department"
                      >
                        <Trash2 className="h-4 w-4" />
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
        title={selectedDepartment ? 'Edit department' : 'Add department'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Input
            label="Department name"
            placeholder="e.g. Operations"
            {...register('name')}
            error={errors.name?.message}
          />
          <Input
            label="Description"
            placeholder="Describe the department scope"
            {...register('description')}
            error={errors.description?.message}
          />
          <div className="flex justify-end gap-3 border-t border-border-faint pt-5">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
              {selectedDepartment ? 'Save changes' : 'Create department'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete department"
      >
        <div className="space-y-6">
          <div className="info-strip border-warning-base/20 bg-warning-base/10 text-ink-muted">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning-base" />
            <div>
              <p className="font-semibold text-ink-base">This action permanently removes the department.</p>
              <p className="mt-1 leading-7">
                Deletion will fail if the department still contains active employees.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t border-border-faint pt-5">
            <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} isLoading={deleteMutation.isPending}>
              Delete department
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
