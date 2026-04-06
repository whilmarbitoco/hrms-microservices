import { motion } from 'motion/react';
import { Wallet, TrendingUp, FileText, PieChart, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';

export default function PayrollDashboard({ user }: { user: any }) {
  const navigate = useNavigate();

  const stats = [
    { label: 'Total Payroll', value: '$45,200', icon: Wallet, color: 'bg-green-500' },
    { label: 'Pending Batch', value: '1', icon: Clock, color: 'bg-amber-500' },
    { label: 'Processed', value: '124', icon: CheckCircle2, color: 'bg-emerald-500' },
    { label: 'Adjustments', value: '5', icon: TrendingUp, color: 'bg-indigo-500' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payroll & Finance Dashboard</h1>
          <p className="text-slate-500">Welcome, {user?.name}. Manage salary disbursements and financial reporting.</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => navigate('/payroll')}>
            <TrendingUp className="mr-2 h-4 w-4" />
            Process Payroll
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
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Recent Payroll Batches</h3>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Payroll Batch - March 2026</p>
                    <p className="text-xs text-slate-500">Processed on Mar 31, 2026 • 124 Employees</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">$45,200.00</p>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase">Completed</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Financial Summary</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PieChart className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-slate-600">Base Salary</span>
              </div>
              <span className="text-sm font-semibold text-slate-900">$38,500</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-slate-600">Allowances</span>
              </div>
              <span className="text-sm font-semibold text-slate-900">$4,200</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-slate-600">Deductions</span>
              </div>
              <span className="text-sm font-semibold text-red-600">-$2,500</span>
            </div>
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900">Net Payable</span>
              <span className="text-lg font-bold text-indigo-600">$40,200</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
