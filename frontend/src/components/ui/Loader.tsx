import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface LoaderProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  fullPage?: boolean;
}

export function Loader({ className, size = 'md', fullPage }: LoaderProps) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const content = (
    <div className={cn("flex items-center justify-center", className)}>
      <Loader2 className={cn("animate-spin text-accent-base", sizes[size])} />
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-paper-base/80 backdrop-blur-sm">
        <div className="section-card flex flex-col items-center gap-3 px-8 py-7">
          {content}
          <p className="text-sm font-medium text-ink-muted">Loading workspace data</p>
        </div>
      </div>
    );
  }

  return content;
}
