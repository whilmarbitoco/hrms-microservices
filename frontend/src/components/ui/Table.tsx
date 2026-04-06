import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface TableProps {
  headers: string[];
  children: ReactNode;
  className?: string;
}

export function Table({ headers, children, className }: TableProps) {
  return (
    <div className={cn("w-full overflow-x-auto rounded-lg border border-slate-200 bg-white", className)}>
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
          <tr>
            {headers.map((header, i) => (
              <th key={i} className="px-6 py-3 font-semibold uppercase tracking-wider text-xs">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {children}
        </tbody>
      </table>
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
      className={cn(
        "hover:bg-slate-50 transition-colors", 
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
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
    <td colSpan={colSpan} className={cn("px-6 py-4 whitespace-nowrap text-slate-600", className)}>
      {children}
    </td>
  );
}
