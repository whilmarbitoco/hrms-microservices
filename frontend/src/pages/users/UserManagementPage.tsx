import { useState } from 'react';
import { useUsers, useDeactivateUser, useReactivateUser, useCreateUser } from '../../hooks/useUsers';
import { Table, TableRow, TableCell } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Loader } from '../../components/ui/Loader';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { UserPlus, Shield, UserX, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABELS_BY_NAME, ROLE_OPTIONS, ROLES } from '../../constants';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role_id: z.string().min(1, 'Role is required'),
  employee_id: z.string().optional(),
});

type CreateUserForm = z.infer<typeof createUserSchema>;

export default function UserManagementPage() {
  const { hasPermission } = useAuth();
  const { data: users, isLoading, isError, error, refetch } = useUsers();
  const createUserMutation = useCreateUser();
  const deactivateMutation = useDeactivateUser();
  const reactivateMutation = useReactivateUser();
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      role_id: ROLES.EMPLOYEE.toString(),
    }
  });

  const onSubmit = (data: CreateUserForm) => {
    createUserMutation.mutate({
      ...data,
      role_id: Number(data.role_id),
    }, {
      onSuccess: () => {
        setIsCreateModalOpen(false);
        reset();
      }
    });
  };

  if (isLoading) return <Loader fullPage />;
  if (isError) return <ErrorState message={(error as any).error || 'Failed to load users'} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-500">Manage system users, roles, and access permissions.</p>
        </div>
        {hasPermission('user.create') && (
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        )}
      </div>

      {!users || users.length === 0 ? (
        <EmptyState 
          title="No users found" 
          description="Get started by creating your first system user."
          action={hasPermission('user.create') && <Button onClick={() => setIsCreateModalOpen(true)}>Add User</Button>}
        />
      ) : (
        <Table headers={['Name', 'Email', 'Role', 'Status', 'Actions']}>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium text-slate-900">{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-slate-400" />
                  <span className="capitalize">
                    {user.role ? (ROLE_LABELS_BY_NAME[user.role] ?? user.role) : 'Role not assigned'}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {user.is_active ? (
                    hasPermission('user.deactivate') && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => deactivateMutation.mutate(user.id)}
                        isLoading={deactivateMutation.isPending && deactivateMutation.variables === user.id}
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                    )
                  ) : (
                    hasPermission('user.reactivate') && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => reactivateMutation.mutate(user.id)}
                        isLoading={reactivateMutation.isPending && reactivateMutation.variables === user.id}
                      >
                        <UserCheck className="h-4 w-4" />
                      </Button>
                    )
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </Table>
      )}

      {/* Create User Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add New User"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input 
            label="Full Name" 
            placeholder="John Doe" 
            {...register('name')} 
            error={errors.name?.message} 
          />
          <Input 
            label="Email Address" 
            type="email" 
            placeholder="user@hrms.com" 
            {...register('email')} 
            error={errors.email?.message} 
          />
          <Input 
            label="Password" 
            type="password" 
            placeholder="••••••••" 
            {...register('password')} 
            error={errors.password?.message} 
          />
          <Input 
            label="Employee ID (Optional)" 
            placeholder="EMP001" 
            {...register('employee_id')} 
            error={errors.employee_id?.message} 
          />
          <Select 
            label="Role" 
            options={ROLE_OPTIONS.map((role) => ({ label: role.label, value: role.id }))}
            {...register('role_id')} 
            error={errors.role_id?.message}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" type="button" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={createUserMutation.isPending}>Create User</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
