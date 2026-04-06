import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Briefcase, 
  Wallet, 
  CalendarDays, 
  LogOut, 
  Menu, 
  X,
  UserCircle,
  Settings
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/Button';

export default function MainLayout() {
  const { user, logout, hasPermission } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard',
      permission: null,
    },
    {
      title: 'User Management',
      icon: Settings,
      path: '/users',
      permission: 'user.view',
    },
    {
      title: 'Departments',
      icon: Building2,
      path: '/departments',
      permission: 'department.view',
    },
    {
      title: 'Employee Roles',
      icon: Briefcase,
      path: '/employee-roles',
      permission: 'employee_role.view',
    },
    {
      title: 'Employees',
      icon: Users,
      path: '/employees',
      permission: 'employee.view',
    },
    {
      title: 'Payroll',
      icon: Wallet,
      path: '/payroll',
      permission: 'payroll.view',
    },
    {
      title: 'Leave Management',
      icon: CalendarDays,
      path: '/leave',
      permission: 'leave_request.view',
    },
    {
      title: 'Leave Calendar',
      icon: CalendarDays,
      path: '/leave/calendar',
      permission: 'leave_request.view',
    },
  ];

  const filteredMenu = menuItems.filter(item => !item.permission || hasPermission(item.permission));

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transition-transform lg:static lg:translate-x-0",
        !isSidebarOpen && "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          <div className="p-6">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <span className="text-white font-bold text-xl">H</span>
              </div>
              <span className="text-xl font-bold text-slate-900">HRMS</span>
            </Link>
          </div>

          <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
            {filteredMenu.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  location.pathname.startsWith(item.path)
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.title}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-200">
            <Link to="/profile" className="flex items-center gap-3 px-3 py-2 mb-2 hover:bg-slate-100 rounded-md transition-colors">
              <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center">
                <UserCircle className="h-6 w-6 text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
            </Link>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8">
          <button 
            className="p-2 -ml-2 text-slate-600 lg:hidden"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex-1 px-4">
            <h2 className="text-lg font-semibold text-slate-900">
              {menuItems.find(item => location.pathname.startsWith(item.path))?.title || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Header actions like notifications could go here */}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
