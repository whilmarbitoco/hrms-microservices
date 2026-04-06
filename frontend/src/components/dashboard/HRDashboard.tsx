import { motion } from 'motion/react';
import { Users, UserPlus, CalendarDays, Briefcase, Clock, TrendingUp, Search } from 'lucide-react';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';

export default function HRDashboard({ user }: { user: any }) {
  const navigate = useNavigate();

  const stats = [
    { label: 'Total Employees', value: '124', icon: Users, color: 'bg-blue-500' },
    { label: 'Open Roles', value: '5', icon: Briefcase, color: 'bg-indigo-500' },
    { label: 'Pending Leaves', value: '12', icon: CalendarDays, color: 'bg-amber-500' },
    { label: 'New Hires', value: '3', icon: UserPlus, color: 'bg-emerald-500' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Human Resources Dashboard</h1>
          <p className="text-slate-500">Welcome, {user?.name}. Manage your workforce and recruitment.</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => navigate('/employees')}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Employee
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Recent Leave Requests</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/leave')}>View All</Button>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">JD</div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">John Doe</p>
                    <p className="text-xs text-slate-500">Annual Leave • 3 days</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50">Reject</Button>
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">Approve</Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">HR Quick Links</h3>
          <div className="grid grid-cols-2 gap-4">
            <button className="p-4 rounded-lg border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left group" onClick={() => navigate('/employees')}>
              <Users className="h-6 w-6 text-slate-400 group-hover:text-indigo-600 mb-2" />
              <p className="text-sm font-medium text-slate-900">Employee List</p>
              <p className="text-xs text-slate-500">View and edit records</p>
            </button>
            <button className="p-4 rounded-lg border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left group" onClick={() => navigate('/leave')}>
              <CalendarDays className="h-6 w-6 text-slate-400 group-hover:text-indigo-600 mb-2" />
              <p className="text-sm font-medium text-slate-900">Leave Calendar</p>
              <p className="text-xs text-slate-500">Track staff availability</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
