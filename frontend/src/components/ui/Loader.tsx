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
      <Loader2 className={cn("animate-spin text-indigo-600", sizes[size])} />
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
}
