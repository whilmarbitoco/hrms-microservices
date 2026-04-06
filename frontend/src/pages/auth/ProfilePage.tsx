import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABELS_BY_NAME } from '../../constants';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { toast } from '../../components/ui/Toaster';
import { UserCircle, Shield, Mail, Hash, Lock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const passwordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(8, 'New password must be at least 8 characters'),
  confirm_password: z.string().min(8, 'Please confirm your password'),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

type PasswordForm = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const { user } = useAuth();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const onPasswordSubmit = async (data: PasswordForm) => {
    setIsLoading(true);
    try {
      await api.patch('/auth/me/password', {
        current_password: data.current_password,
        new_password: data.new_password,
      });
      toast.success('Password updated successfully');
      setIsChangingPassword(false);
      reset();
    } catch (error: any) {
      toast.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <p className="text-slate-500">Manage your personal information and account settings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center">
            <div className="mx-auto h-24 w-24 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
              <UserCircle className="h-16 w-16 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">{user?.name}</h3>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-2">
              <div className="flex items-center justify-center gap-2 text-xs font-medium text-slate-600">
                <Shield className="h-3.5 w-3.5" />
                <span className="capitalize">
                  Role: {user?.role ? (ROLE_LABELS_BY_NAME[user.role] ?? user.role) : 'Role not assigned'}
                </span>
              </div>
              <div className="flex items-center justify-center gap-2 text-xs font-medium text-slate-600">
                <Hash className="h-3.5 w-3.5" />
                <span>ID: {user?.employee_id || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Role-Specific Quick Actions */}
          {user?.role === 'admin' && (
            <div className="mt-6 bg-indigo-50 p-4 rounded-xl border border-indigo-100">
              <h4 className="text-sm font-semibold text-indigo-900 mb-2">Admin Panel</h4>
              <p className="text-xs text-indigo-700 mb-3">You have full system access. Use the management tools to oversee operations.</p>
              <Button variant="outline" size="sm" className="w-full bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50" onClick={() => window.location.href = '/users'}>
                Go to User Management
              </Button>
            </div>
          )}

          {user?.role === 'hr_manager' && (
            <div className="mt-6 bg-emerald-50 p-4 rounded-xl border border-emerald-100">
              <h4 className="text-sm font-semibold text-emerald-900 mb-2">HR Dashboard</h4>
              <p className="text-xs text-emerald-700 mb-3">Manage employee records, leave requests, and recruitment pipelines.</p>
              <Button variant="outline" size="sm" className="w-full bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={() => window.location.href = '/employees'}>
                Manage Employees
              </Button>
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Account Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Full Name" value={user?.name} disabled />
              <Input label="Email Address" value={user?.email} disabled />
              <Input label="Employee ID" value={user?.employee_id || ''} disabled />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Security</h3>
              {!isChangingPassword && (
                <Button variant="outline" size="sm" onClick={() => setIsChangingPassword(true)}>
                  <Lock className="mr-2 h-4 w-4" />
                  Change Password
                </Button>
              )}
            </div>

            {isChangingPassword ? (
              <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-4 max-w-md">
                <Input 
                  label="Current Password" 
                  type="password" 
                  {...register('current_password')}
                  error={errors.current_password?.message}
                />
                <Input 
                  label="New Password" 
                  type="password" 
                  {...register('new_password')}
                  error={errors.new_password?.message}
                />
                <Input 
                  label="Confirm New Password" 
                  type="password" 
                  {...register('confirm_password')}
                  error={errors.confirm_password?.message}
                />
                <div className="flex gap-3 pt-2">
                  <Button type="submit" isLoading={isLoading}>Update Password</Button>
                  <Button type="button" variant="ghost" onClick={() => setIsChangingPassword(false)}>Cancel</Button>
                </div>
              </form>
            ) : (
              <p className="text-sm text-slate-500">
                Keep your account secure by using a strong password.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
