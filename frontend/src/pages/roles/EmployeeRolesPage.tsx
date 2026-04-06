import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, Briefcase, Edit2, Plus, Trash2 } from 'lucide-react';
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
  useCreateEmployeeRole,
  useDeleteEmployeeRole,
  useEmployeeRoles,
  useUpdateEmployeeRole,
} from '../../hooks/useEmployeeRoles';

const roleSchema = z.object({
  name: z.string().min(2, 'Role name must be at least 2 characters'),
  description: z.string().optional(),
  level: z.string().optional(),
});

type RoleForm = z.infer<typeof roleSchema>;

export default function EmployeeRolesPage() {
  const { hasPermission } = useAuth();
  const { data: roles, isLoading, isError, error, refetch } = useEmployeeRoles();
  const createMutation = useCreateEmployeeRole();
  const updateMutation = useUpdateEmployeeRole();
  const deleteMutation = useDeleteEmployeeRole();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<RoleForm>({
    resolver: zodResolver(roleSchema),
  });

  const onSubmit = (data: RoleForm) => {
    if (selectedRole) {
      updateMutation.mutate(
        { id: selectedRole.id, payload: data },
        {
          onSuccess: () => {
            setIsModalOpen(false);
            setSelectedRole(null);
            reset();
          },
        }
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          setIsModalOpen(false);
          reset();
        },
      });
    }
  };

  const handleEdit = (role: any) => {
    setSelectedRole(role);
    setValue('name', role.name);
    setValue('level', role.level || '');
    setValue('description', role.description || '');
    setIsModalOpen(true);
  };

  const handleDelete = () => {
    if (!selectedRole) return;
    deleteMutation.mutate(selectedRole.id, {
      onSuccess: () => {
        setIsDeleteModalOpen(false);
        setSelectedRole(null);
      },
    });
  };

  if (isLoading) return <Loader fullPage />;
  if (isError) {
    return (
      <ErrorState
        title="Unable to load employee roles"
        message={(error as any).error || 'The employee role catalog could not be synchronized.'}
        onRetry={refetch}
      />
    );
  }

  const levelOptions = [
    { label: 'Select level', value: '' },
    { label: 'Junior', value: 'junior' },
    { label: 'Mid', value: 'mid' },
    { label: 'Senior', value: 'senior' },
    { label: 'Lead', value: 'lead' },
    { label: 'Principal', value: 'principal' },
  ];

  const openCreateModal = () => {
    setSelectedRole(null);
    reset();
    setIsModalOpen(true);
  };

  return (
    <div className="page-shell">
      <header className="page-header">
        <div className="page-heading">
          <div className="page-eyebrow">
            <span>Workforce structure</span>
            <span>/</span>
            <span>Employee roles</span>
          </div>
          <h1 className="page-title">Employee roles</h1>
          <p className="page-subtitle">
            Maintain role definitions, capture seniority, and keep role assignments aligned with
            the company structure.
          </p>
        </div>
        {hasPermission('employee_role.create') && (
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4" />
            Add role
          </Button>
        )}
      </header>

      <section className="section-card">
        <div className="section-header">
          <div>
            <h2 className="section-title">Role catalog</h2>
            <p className="section-description">
              {roles?.length ?? 0} role definition(s) are currently available.
            </p>
          </div>
        </div>

        {!roles || roles.length === 0 ? (
          <EmptyState
            title="No employee roles found"
            description="Create the first role definition to start mapping workforce positions."
            icon={Briefcase}
            action={
              hasPermission('employee_role.create') ? (
                <Button variant="outline" onClick={openCreateModal}>
                  Add role
                </Button>
              ) : null
            }
          />
        ) : (
          <Table headers={['Role', 'Level', 'Description', 'Employees', 'Actions']}>
            {roles.map((role) => (
              <TableRow key={role.id}>
                <TableCell>
                  <p className="text-sm font-semibold text-ink-base">{role.name}</p>
                </TableCell>
                <TableCell>
                  <span className="status-badge status-badge-neutral">{role.level || 'Not set'}</span>
                </TableCell>
                <TableCell className="max-w-md text-sm text-ink-muted">
                  {role.description || 'No description provided'}
                </TableCell>
                <TableCell className="text-sm font-semibold text-ink-base">
                  {role.employee_count || 0}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {hasPermission('employee_role.update') && (
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(role)} title="Edit role">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                    {hasPermission('employee_role.delete') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-error-base hover:bg-error-base hover:text-white"
                        onClick={() => {
                          setSelectedRole(role);
                          setIsDeleteModalOpen(true);
                        }}
                        title="Delete role"
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
        title={selectedRole ? 'Edit employee role' : 'Add employee role'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Input
            label="Role name"
            placeholder="e.g. Backend Operations Lead"
            {...register('name')}
            error={errors.name?.message}
          />
          <Select label="Level" options={levelOptions} {...register('level')} error={errors.level?.message} />
          <Input
            label="Description"
            placeholder="Describe the role and responsibilities"
            {...register('description')}
            error={errors.description?.message}
          />
          <div className="flex justify-end gap-3 border-t border-border-faint pt-5">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
              {selectedRole ? 'Save changes' : 'Create role'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete employee role">
        <div className="space-y-6">
          <div className="info-strip border-warning-base/20 bg-warning-base/10 text-ink-muted">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning-base" />
            <div>
              <p className="font-semibold text-ink-base">This action permanently removes the role definition.</p>
              <p className="mt-1 leading-7">
                Deletion will fail if employees are still assigned to this role.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t border-border-faint pt-5">
            <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} isLoading={deleteMutation.isPending}>
              Delete role
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
