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
    <div className={cn("flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-base bg-paper-raised p-12 text-center shadow-sm", className)}>
      <div className="mb-4 rounded-2xl border border-border-base bg-paper-sunken p-4">
        <Icon className="h-8 w-8 text-ink-muted" />
      </div>
      <h3 className="text-xl font-bold tracking-tight text-ink-base">{title}</h3>
      {description && <p className="mt-2 max-w-md text-sm leading-7 text-ink-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
