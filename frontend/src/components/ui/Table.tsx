import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface TableProps {
  headers: string[];
  children: ReactNode;
  className?: string;
}

export function Table({ headers, children, className }: TableProps) {
  return (
    <div className={cn('w-full overflow-hidden rounded-xl border border-border-base bg-paper-raised shadow-sm', className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-border-base bg-paper-sunken/50">
              {headers.map((header, i) => (
                <th
                  key={i}
                  className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-muted"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-faint">
            {children}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface TableRowProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  key?: any;
}

export function TableRow({ children, className, onClick }: TableRowProps) {
  return (
    <tr 
      onClick={onClick}
      className={cn(
        'group transition-colors hover:bg-paper-sunken/35', 
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </tr>
  );
}

interface TableCellProps {
  children: ReactNode;
  className?: string;
  colSpan?: number;
}

export function TableCell({ children, className, colSpan }: TableCellProps) {
  return (
    <td colSpan={colSpan} className={cn('px-6 py-4 align-middle text-ink-base font-medium', className)}>
      {children}
    </td>
  );
}
