import React from 'react';
import { PackageOpen } from 'lucide-react';
import { cn } from '../../lib/utils';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: any;
  className?: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, icon: Icon = PackageOpen, className, action }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl border border-dashed border-slate-300", className)}>
      <div className="p-4 bg-slate-50 rounded-full mb-4">
        <Icon className="h-8 w-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      {description && <p className="mt-1 text-sm text-slate-500 max-w-xs">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
