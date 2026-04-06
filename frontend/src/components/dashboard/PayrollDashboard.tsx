import { motion } from 'motion/react';
import { AlertCircle, CheckCircle2, Clock, FileText, PieChart, TrendingUp, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';

export default function PayrollDashboard({ user }: { user: any }) {
  const navigate = useNavigate();

  const stats = [
    { label: 'Current payroll total', value: '$45,200', meta: 'Latest monthly run', icon: Wallet },
    { label: 'Pending batches', value: '1', meta: 'Runs awaiting completion', icon: Clock },
    { label: 'Processed payslips', value: '124', meta: 'Completed this cycle', icon: CheckCircle2 },
    { label: 'Adjustments', value: '5', meta: 'Open payroll adjustments', icon: TrendingUp },
  ];

  return (
    <div className="page-shell">
      <section className="hero-banner">
        <div className="hero-content">
          <div>
            <p className="hero-kicker">Payroll operations</p>
            <h1 className="hero-title">Compensation and disbursement overview</h1>
            <p className="hero-text">
              Review payroll cycle health, recent batches, and high-level pay composition from one
              structured finance workspace.
            </p>
            <div className="hero-meta">
              <span className="hero-meta-chip">Signed in as {user?.name}</span>
              <span className="hero-meta-chip">Finance workspace</span>
            </div>
          </div>
          <Button onClick={() => navigate('/payroll')}>Process payroll</Button>
        </div>
      </section>

      <section className="metric-grid">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className="metric-card"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="metric-label">{stat.label}</p>
                <p className="metric-value">{stat.value}</p>
                <p className="metric-meta">{stat.meta}</p>
              </div>
              <div className="rounded-2xl border border-border-base bg-paper-sunken p-3">
                <stat.icon className="h-5 w-5 text-accent-base" />
              </div>
            </div>
          </motion.div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="section-card">
          <div className="section-header">
            <div>
              <h2 className="section-title">Recent payroll batches</h2>
              <p className="section-description">Latest completed payroll runs and their totals.</p>
            </div>
          </div>

          <div className="data-list">
            {[1, 2].map((i) => (
              <div key={i} className="data-list-row">
                <div className="flex items-center gap-4">
                  <div className="rounded-2xl border border-border-base bg-paper-sunken p-3">
                    <FileText className="h-5 w-5 text-accent-base" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink-base">Payroll Batch - March 2026</p>
                    <p className="mt-1 text-sm text-ink-muted">
                      Processed on Mar 31, 2026 . 124 employees
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-ink-base">$45,200.00</p>
                  <span className="status-badge status-badge-success">Completed</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="section-card">
          <div className="section-header">
            <div>
              <h2 className="section-title">Financial summary</h2>
              <p className="section-description">Top-level breakdown of the active payroll run.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-border-base bg-paper-sunken/25 px-4 py-4">
              <div className="flex items-center gap-3">
                <PieChart className="h-4 w-4 text-accent-base" />
                <span className="text-sm text-ink-base">Base salary</span>
              </div>
              <span className="text-sm font-semibold text-ink-base">$38,500</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border-base bg-paper-sunken/25 px-4 py-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-4 w-4 text-accent-base" />
                <span className="text-sm text-ink-base">Allowances</span>
              </div>
              <span className="text-sm font-semibold text-ink-base">$4,200</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border-base bg-paper-sunken/25 px-4 py-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-4 w-4 text-error-base" />
                <span className="text-sm text-ink-base">Deductions</span>
              </div>
              <span className="text-sm font-semibold text-error-base">-$2,500</span>
            </div>
            <div className="rounded-xl border border-border-base bg-paper-raised px-4 py-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-ink-muted">Net payable</p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-accent-base">$40,200</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
