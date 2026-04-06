import { useState } from 'react';
import { useDepartments, useCreateDepartment, useUpdateDepartment, useDeleteDepartment } from '../../hooks/useDepartments';
import { Table, TableRow, TableCell } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Loader } from '../../components/ui/Loader';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Plus, Trash2, Edit2, Building2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const departmentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
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
  const [selectedDept, setSelectedDept] = useState<any>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<DepartmentForm>({
    resolver: zodResolver(departmentSchema),
  });

  const onSubmit = (data: DepartmentForm) => {
    const payload = {
      ...data,
      manager_id: data.manager_id ? Number(data.manager_id) : undefined,
    };

    if (selectedDept) {
      updateMutation.mutate({ id: selectedDept.id, payload }, {
        onSuccess: () => {
          setIsModalOpen(false);
          setSelectedDept(null);
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

  const handleEdit = (dept: any) => {
    setSelectedDept(dept);
    setValue('name', dept.name);
    setValue('description', dept.description || '');
    setValue('manager_id', dept.manager_id?.toString() || '');
    setIsModalOpen(true);
  };

  const handleDelete = () => {
    if (!selectedDept) return;
    deleteMutation.mutate(selectedDept.id, {
      onSuccess: () => {
        setIsDeleteModalOpen(false);
        setSelectedDept(null);
      }
    });
  };

  if (isLoading) return <Loader fullPage />;
  if (isError) return <ErrorState message={(error as any).error || 'Failed to load departments'} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Departments</h1>
          <p className="text-slate-500">Manage your organization's departments and structure.</p>
        </div>
        {hasPermission('department.create') && (
          <Button onClick={() => {
            setSelectedDept(null);
            reset();
            setIsModalOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Department
          </Button>
        )}
      </div>

      {!departments || departments.length === 0 ? (
        <EmptyState 
          title="No departments found" 
          description="Start by creating your first department."
          icon={Building2}
          action={hasPermission('department.create') && <Button onClick={() => setIsModalOpen(true)}>Add Department</Button>}
        />
      ) : (
        <Table headers={['Name', 'Description', 'Employees', 'Actions']}>
          {departments.map((dept) => (
            <TableRow key={dept.id}>
              <TableCell className="font-medium text-slate-900">{dept.name}</TableCell>
              <TableCell className="max-w-xs truncate">{dept.description || '-'}</TableCell>
              <TableCell>{dept.employee_count || 0}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {hasPermission('department.update') && (
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(dept)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  )}
                  {hasPermission('department.delete') && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700"
                      onClick={() => {
                        setSelectedDept(dept);
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
        title={selectedDept ? 'Edit Department' : 'Add New Department'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input 
            label="Department Name" 
            placeholder="e.g. Engineering" 
            {...register('name')}
            error={errors.name?.message}
          />
          <Input 
            label="Description" 
            placeholder="Department purpose..." 
            {...register('description')}
            error={errors.description?.message}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
              {selectedDept ? 'Update' : 'Create'} Department
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
            Are you sure you want to delete the <span className="font-bold text-slate-900">{selectedDept?.name}</span> department? 
            This will only work if there are no active employees assigned to it.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button 
              variant="danger" 
              onClick={handleDelete}
              isLoading={deleteMutation.isPending}
            >
              Delete Department
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
