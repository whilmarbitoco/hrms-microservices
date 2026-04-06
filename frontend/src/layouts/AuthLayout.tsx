import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">HRMS System</h1>
          <p className="mt-2 text-sm text-slate-600">Manage your workforce efficiently</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
