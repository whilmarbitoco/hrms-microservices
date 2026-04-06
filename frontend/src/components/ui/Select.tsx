import { SelectHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { label: string; value: string | number }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, disabled, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5 text-left group/field">
        {label && (
          <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            disabled={disabled}
            className={cn(
              'block h-11 w-full appearance-none rounded-lg border border-border-base bg-paper-raised px-4 py-2.5 pr-10 text-sm text-ink-base shadow-sm transition-all focus:border-accent-base focus:ring-4 focus:ring-accent-base/5 focus:outline-none disabled:cursor-not-allowed disabled:bg-paper-sunken disabled:opacity-50',
              error && 'border-error-base focus:border-error-base focus:ring-error-base/5',
              className
            )}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none transition-colors group-focus-within/field:text-accent-base">
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
        {error && (
          <p className="text-xs font-medium text-error-base animate-in fade-in slide-in-from-top-1">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
