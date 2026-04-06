import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const variants = {
      primary: 'border border-accent-base bg-accent-base text-white hover:bg-accent-deep hover:border-accent-deep shadow-sm',
      secondary: 'border border-border-base bg-paper-sunken text-ink-base hover:bg-border-faint',
      outline: 'border border-border-base bg-paper-raised text-ink-base hover:bg-paper-sunken hover:border-border-strong',
      ghost: 'border border-transparent bg-transparent text-ink-muted hover:bg-paper-sunken hover:text-ink-base',
      danger: 'border border-error-base bg-error-base text-white hover:opacity-95 shadow-sm',
    };

    const sizes = {
      sm: 'h-9 px-3.5 text-xs font-semibold',
      md: 'h-11 px-4.5 text-sm font-semibold',
      lg: 'h-12 px-6 text-base font-semibold',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'btn-base rounded-lg whitespace-nowrap transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-accent-base/10',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
        <span className="flex items-center gap-2">{children}</span>
      </button>
    );
  }
);

Button.displayName = 'Button';
