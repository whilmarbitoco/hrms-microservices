import { InputHTMLAttributes, forwardRef, ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, helperText, disabled, type = 'text', ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5 text-left group/field">
        {label && (
          <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint group-focus-within/field:text-accent-base transition-colors pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            disabled={disabled}
            type={type}
            className={cn(
              'block h-11 w-full rounded-lg border border-border-base bg-paper-raised px-4 py-2.5 text-sm text-ink-base shadow-sm transition-all placeholder:text-ink-faint focus:border-accent-base focus:ring-4 focus:ring-accent-base/5 focus:outline-none disabled:bg-paper-sunken disabled:opacity-50',
              icon && 'pl-11',
              error && 'border-error-base focus:border-error-base focus:ring-error-base/5',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs font-medium text-error-base animate-in fade-in slide-in-from-top-1">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p className="text-xs text-ink-muted leading-relaxed">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
