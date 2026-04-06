import { motion } from 'motion/react';
import { Users, Building2, ShieldCheck, Activity, UserPlus, Settings, Database } from 'lucide-react';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard({ user }: { user: any }) {
  const navigate = useNavigate();

  const stats = [
    { label: 'Total Users', value: '156', icon: Users, color: 'bg-blue-500' },
    { label: 'Active Depts', value: '12', icon: Building2, color: 'bg-indigo-500' },
    { label: 'System Health', value: '99.9%', icon: Activity, color: 'bg-emerald-500' },
    { label: 'Security Logs', value: '24', icon: ShieldCheck, color: 'bg-slate-700' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Administrator Console</h1>
          <p className="text-slate-500">Welcome, {user?.name}. You have full system oversight.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/users')}>
            <Settings className="mr-2 h-4 w-4" />
            System Settings
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4"
          >
            <div className={`${stat.color} p-3 rounded-lg`}>
              <stat.icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">System Overview</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Database Status</p>
                  <p className="text-xs text-slate-500">Connected to Production Cluster</p>
                </div>
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Healthy</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Security Audit</p>
                  <p className="text-xs text-slate-500">Last scan completed 4 hours ago</p>
                </div>
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Secure</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Admin Actions</h3>
          <div className="space-y-3">
            <Button className="w-full justify-start" variant="outline" onClick={() => navigate('/users')}>
              <UserPlus className="mr-2 h-4 w-4" />
              Manage User Access
            </Button>
            <Button className="w-full justify-start" variant="outline" onClick={() => navigate('/departments')}>
              <Building2 className="mr-2 h-4 w-4" />
              Configure Departments
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
