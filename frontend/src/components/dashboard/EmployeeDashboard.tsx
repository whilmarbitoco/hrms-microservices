import { motion } from 'motion/react';
import { CalendarDays, Wallet, Clock, UserCircle, FileText, CheckCircle2, TrendingUp } from 'lucide-react';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';

export default function EmployeeDashboard({ user }: { user: any }) {
  const navigate = useNavigate();

  const stats = [
    { label: 'Leave Balance', value: '15 Days', icon: CalendarDays, color: 'bg-blue-500' },
    { label: 'Next Payday', value: 'Apr 30', icon: Wallet, color: 'bg-green-500' },
    { label: 'Pending Requests', value: '2', icon: Clock, color: 'bg-amber-500' },
    { label: 'Payslips', value: '12', icon: FileText, color: 'bg-indigo-500' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Employee Portal</h1>
          <p className="text-slate-500">Welcome, {user?.name}. Access your personal records and requests.</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => navigate('/leave')}>
            <CalendarDays className="mr-2 h-4 w-4" />
            Request Leave
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
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Recent Leave History</h3>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Annual Leave - {i === 1 ? 'Approved' : 'Completed'}</p>
                    <p className="text-xs text-slate-500">Mar 15 - Mar 18, 2026 • 3 days</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                  i === 1 ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'
                }`}>
                  {i === 1 ? 'Approved' : 'Completed'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Personal Quick Links</h3>
          <div className="space-y-3">
            <Button className="w-full justify-start" variant="outline" onClick={() => navigate('/profile')}>
              <UserCircle className="mr-2 h-4 w-4" />
              My Profile Settings
            </Button>
            <Button className="w-full justify-start" variant="outline" onClick={() => navigate('/payroll')}>
              <Wallet className="mr-2 h-4 w-4" />
              View My Payslips
            </Button>
            <Button className="w-full justify-start" variant="outline" onClick={() => navigate('/leave')}>
              <TrendingUp className="mr-2 h-4 w-4" />
              Leave Balance Details
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
