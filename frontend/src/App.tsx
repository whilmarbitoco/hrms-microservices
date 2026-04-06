/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from './components/ui/Toaster';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

// Dashboard
import DashboardPage from './pages/DashboardPage';

// Modules
import UserManagementPage from './pages/users/UserManagementPage';
import DepartmentsPage from './pages/departments/DepartmentsPage';
import EmployeeRolesPage from './pages/roles/EmployeeRolesPage';
import EmployeesPage from './pages/employees/EmployeesPage';
import EmployeeDetailsPage from './pages/employees/EmployeeDetailsPage';
import PayrollPage from './pages/payroll/PayrollPage';
import LeaveManagementPage from './pages/leave/LeaveManagementPage';
import LeaveCalendarPage from './pages/leave/LeaveCalendarPage';
import ProfilePage from './pages/auth/ProfilePage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function ProtectedRoute({ children, permission }: { children: React.ReactNode; permission?: string }) {
  const { user, isLoading, hasPermission } = useAuth();

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  if (permission && !hasPermission(permission)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Auth Routes */}
            <Route path="/auth" element={<AuthLayout />}>
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="forgot-password" element={<ForgotPasswordPage />} />
              <Route path="reset-password" element={<ResetPasswordPage />} />
            </Route>

            {/* Protected App Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="users" element={<UserManagementPage />} />
              <Route path="departments" element={<DepartmentsPage />} />
              <Route path="employee-roles" element={<EmployeeRolesPage />} />
              <Route path="employees" element={<EmployeesPage />} />
              <Route path="employees/:id" element={<EmployeeDetailsPage />} />
              <Route path="payroll" element={<PayrollPage />} />
              <Route path="leave" element={<LeaveManagementPage />} />
              <Route path="leave/calendar" element={<LeaveCalendarPage />} />
              <Route path="profile" element={<ProfilePage />} />
              
              {/* Other modules will be added here */}
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}
