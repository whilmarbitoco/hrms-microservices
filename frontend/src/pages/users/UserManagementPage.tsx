import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Shield, UserCheck, UserCircle, UserPlus, UserX } from 'lucide-react';
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
import { ROLE_LABELS_BY_NAME, ROLE_OPTIONS, ROLES } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import { useCreateUser, useDeactivateUser, useReactivateUser, useUsers } from '../../hooks/useUsers';

const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
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

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      role_id: ROLES.EMPLOYEE.toString(),
    },
  });

  const onSubmit = (data: CreateUserForm) => {
    createUserMutation.mutate(
      {
        ...data,
        role_id: Number(data.role_id),
      },
      {
        onSuccess: () => {
          setIsCreateModalOpen(false);
          reset();
        },
      }
    );
  };

  if (isLoading) return <Loader fullPage />;
  if (isError) {
    return (
      <ErrorState
        title="Unable to load users"
        message={(error as any).error || 'The user directory could not be synchronized.'}
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="page-shell">
      <header className="page-header">
        <div className="page-heading">
          <div className="page-eyebrow">
            <span>Access control</span>
            <span>/</span>
            <span>User management</span>
          </div>
          <h1 className="page-title">Users</h1>
          <p className="page-subtitle">
            Provision platform access, assign user roles, and manage account activation across the
            HRMS workspace.
          </p>
        </div>
        {hasPermission('user.create') && (
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Add user
          </Button>
        )}
      </header>

      <section className="section-card">
        <div className="section-header">
          <div>
            <h2 className="section-title">User directory</h2>
            <p className="section-description">
              {users?.length ?? 0} user account(s) are currently configured.
            </p>
          </div>
        </div>

        {!users || users.length === 0 ? (
          <EmptyState
            title="No users found"
            description="Create the first user account to start managing HRMS access."
            icon={Shield}
            action={
              hasPermission('user.create') ? (
                <Button variant="outline" onClick={() => setIsCreateModalOpen(true)}>
                  Add user
                </Button>
              ) : null
            }
          />
        ) : (
          <Table headers={['User', 'Email', 'Role', 'Status', 'Actions']}>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-4">
                    <div className="rounded-2xl border border-border-base bg-paper-sunken p-3">
                      <UserCircle className="h-5 w-5 text-accent-base" />
                    </div>
                    <span className="text-sm font-semibold text-ink-base">{user.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-ink-muted">{user.email}</TableCell>
                <TableCell className="text-sm text-ink-muted">
                  {user.role ? ROLE_LABELS_BY_NAME[user.role] ?? user.role : 'Unassigned'}
                </TableCell>
                <TableCell>
                  <span
                    className={
                      user.is_active
                        ? 'status-badge status-badge-success'
                        : 'status-badge status-badge-danger'
                    }
                  >
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
                          className="text-error-base hover:bg-error-base hover:text-white"
                          onClick={() => deactivateMutation.mutate(user.id)}
                          isLoading={deactivateMutation.isPending && deactivateMutation.variables === user.id}
                          title="Deactivate user"
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      )
                    ) : (
                      hasPermission('user.reactivate') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-success-base hover:bg-success-base hover:text-white"
                          onClick={() => reactivateMutation.mutate(user.id)}
                          isLoading={reactivateMutation.isPending && reactivateMutation.variables === user.id}
                          title="Reactivate user"
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
      </section>

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Add user">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Input
            label="Full name"
            placeholder="e.g. Marcus Aurelius"
            {...register('name')}
            error={errors.name?.message}
          />
          <Input
            label="Email address"
            type="email"
            placeholder="user@company.com"
            {...register('email')}
            error={errors.email?.message}
          />
          <Input
            label="Temporary password"
            type="password"
            placeholder="........"
            {...register('password')}
            error={errors.password?.message}
          />
          <Input
            label="Employee ID"
            placeholder="Optional linked employee record"
            {...register('employee_id')}
            error={errors.employee_id?.message}
          />
          <Select
            label="Role"
            options={ROLE_OPTIONS.map((role) => ({ label: role.label, value: role.id }))}
            {...register('role_id')}
            error={errors.role_id?.message}
          />
          <div className="flex justify-end gap-3 border-t border-border-faint pt-5">
            <Button variant="ghost" type="button" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createUserMutation.isPending}>
              Create user
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
