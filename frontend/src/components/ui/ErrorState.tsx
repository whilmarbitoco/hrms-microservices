import { AlertCircle, RefreshCcw } from 'lucide-react';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ title = "Something went wrong", message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-error-base/20 bg-error-base/5 p-12 text-center">
      <div className="mb-4 rounded-2xl bg-error-base/10 p-4">
        <AlertCircle className="h-8 w-8 text-error-base" />
      </div>
      <h3 className="text-xl font-bold tracking-tight text-error-base">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-7 text-error-base/80">{message}</p>
      {onRetry && (
        <Button 
          variant="outline" 
          className="mt-6 border-error-base/20 text-error-base hover:bg-error-base hover:text-white"
          onClick={onRetry}
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      )}
    </div>
  );
}
