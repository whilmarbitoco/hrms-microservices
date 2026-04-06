import { useState } from 'react';
import { useEmployeeRoles, useCreateEmployeeRole, useUpdateEmployeeRole, useDeleteEmployeeRole } from '../../hooks/useEmployeeRoles';
import { Table, TableRow, TableCell } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Loader } from '../../components/ui/Loader';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Plus, Trash2, Edit2, Briefcase, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const roleSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
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

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<RoleForm>({
    resolver: zodResolver(roleSchema),
  });

  const onSubmit = (data: RoleForm) => {
    if (selectedRole) {
      updateMutation.mutate({ id: selectedRole.id, payload: data }, {
        onSuccess: () => {
          setIsModalOpen(false);
          setSelectedRole(null);
          reset();
        }
      });
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          setIsModalOpen(false);
          reset();
        }
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
      }
    });
  };

  if (isLoading) return <Loader fullPage />;
  if (isError) return <ErrorState message={(error as any).error || 'Failed to load roles'} onRetry={refetch} />;

  const levelOptions = [
    { label: 'Select Level', value: '' },
    { label: 'Junior', value: 'junior' },
    { label: 'Mid', value: 'mid' },
    { label: 'Senior', value: 'senior' },
    { label: 'Lead', value: 'lead' },
    { label: 'Principal', value: 'principal' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Employee Roles</h1>
          <p className="text-slate-500">Define job titles and seniority levels.</p>
        </div>
        {hasPermission('employee_role.create') && (
          <Button onClick={() => {
            setSelectedRole(null);
            reset();
            setIsModalOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Role
          </Button>
        )}
      </div>

      {!roles || roles.length === 0 ? (
        <EmptyState 
          title="No roles found" 
          description="Start by defining your first employee role."
          icon={Briefcase}
          action={hasPermission('employee_role.create') && <Button onClick={() => setIsModalOpen(true)}>Add Role</Button>}
        />
      ) : (
        <Table headers={['Name', 'Level', 'Description', 'Employees', 'Actions']}>
          {roles.map((role) => (
            <TableRow key={role.id}>
              <TableCell className="font-medium text-slate-900">{role.name}</TableCell>
              <TableCell>
                <span className="capitalize px-2 py-1 bg-slate-100 rounded text-xs font-medium">
                  {role.level || 'N/A'}
                </span>
              </TableCell>
              <TableCell className="max-w-xs truncate">{role.description || '-'}</TableCell>
              <TableCell>{role.employee_count || 0}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {hasPermission('employee_role.update') && (
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(role)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  )}
                  {hasPermission('employee_role.delete') && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700"
                      onClick={() => {
                        setSelectedRole(role);
                        setIsDeleteModalOpen(true);
                      }}
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

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedRole ? 'Edit Role' : 'Add New Role'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input 
            label="Role Name" 
            placeholder="e.g. Backend Developer" 
            {...register('name')}
            error={errors.name?.message}
          />
          <Select 
            label="Seniority Level"
            options={levelOptions}
            {...register('level')}
            error={errors.level?.message}
          />
          <Input 
            label="Description" 
            placeholder="Role responsibilities..." 
            {...register('description')}
            error={errors.description?.message}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
              {selectedRole ? 'Update' : 'Create'} Role
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Deletion"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
            <AlertTriangle className="h-5 w-5" />
            <p className="text-sm font-medium">This action cannot be undone.</p>
          </div>
          <p className="text-sm text-slate-600">
            Are you sure you want to delete the <span className="font-bold text-slate-900">{selectedRole?.name}</span> role? 
            This will only work if there are no active employees assigned to it.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button 
              variant="danger" 
              onClick={handleDelete}
              isLoading={deleteMutation.isPending}
            >
              Delete Role
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
