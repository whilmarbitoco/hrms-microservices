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
  ChevronRight
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
      title: 'Users',
      icon: Users,
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
      permission: 'employee.create', 
    },
    {
      title: 'Payroll',
      icon: Wallet,
      path: '/payroll',
      permission: 'payroll.view',
    },
    {
      title: 'Leave',
      icon: CalendarDays,
      path: '/leave',
      permission: 'leave_request.view',
    },
  ];

  const filteredMenu = menuItems.filter(item => !item.permission || hasPermission(item.permission));

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };

  const currentPathTitle = menuItems.find(item => location.pathname.startsWith(item.path))?.title || 'Dashboard';

  return (
    <div className="flex h-screen bg-paper-base">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-ink-base/10 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-paper-raised border-r border-border-base transition-all duration-300 lg:static lg:translate-x-0 shadow-sm",
        !isSidebarOpen && "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          <div className="p-8">
            <Link to="/dashboard" className="flex items-center gap-2 group">
              <div className="h-10 w-10 bg-accent-base rounded-lg flex items-center justify-center transition-all">
                <span className="text-white font-bold text-2xl tracking-tighter">H</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-ink-base">HRMS.</span>
            </Link>
          </div>

          <nav className="flex-1 px-4 space-y-1 overflow-y-auto pb-10">
            <p className="px-4 py-3 text-[10px] font-semibold text-ink-faint uppercase tracking-wider">Management</p>
            {filteredMenu.map((item) => {
              const isActive = location.pathname.startsWith(item.path) || (item.path === '/dashboard' && location.pathname === '/');
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-md transition-all group",
                    isActive
                      ? "bg-accent-muted text-accent-base"
                      : "text-ink-muted hover:bg-paper-sunken hover:text-ink-base"
                  )}
                >
                  <item.icon className={cn("h-4 w-4 transition-colors", isActive ? "text-accent-base" : "text-ink-faint group-hover:text-ink-base")} />
                  {item.title}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 mt-auto border-t border-border-faint">
            <div className="bg-paper-sunken/50 p-4 rounded-lg border border-border-faint">
              <Link to="/profile" className="flex items-center gap-3 mb-4 group">
                <div className="h-10 w-10 rounded-full bg-paper-raised border border-border-base flex items-center justify-center shadow-sm group-hover:border-accent-base transition-colors">
                  <UserCircle className="h-6 w-6 text-ink-faint group-hover:text-accent-base transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-ink-base truncate">{user?.name}</p>
                  <p className="text-[10px] text-ink-faint truncate font-medium">
                    {user?.role?.replace('_', ' ')}
                  </p>
                </div>
              </Link>
              <Button 
                variant="outline" 
                size="sm"
                className="w-full justify-start text-error-base hover:bg-error-base hover:text-white border-error-base/20 transition-all rounded-md"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-20 bg-paper-raised border-b border-border-base flex items-center justify-between px-8 lg:px-12 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-6">
            <button 
              className="p-2 -ml-2 text-ink-muted hover:bg-paper-sunken lg:hidden transition-colors rounded-md"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-[10px] font-medium text-ink-faint mb-0.5">
                <span>Application</span>
                <ChevronRight className="h-2.5 w-2.5" />
                <span>{currentPathTitle}</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-ink-base">
                {currentPathTitle}
              </h2>
            </div>
          </div>

          <div />
        </header>

        <main className="flex-1 overflow-y-auto p-8 lg:p-12 scroll-smooth">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>

  );
}
