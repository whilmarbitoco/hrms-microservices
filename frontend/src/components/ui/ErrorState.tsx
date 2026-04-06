import { AlertCircle, RefreshCcw } from 'lucide-react';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ title = "Something went wrong", message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-red-50 rounded-xl border border-red-100">
      <div className="p-4 bg-red-100 rounded-full mb-4">
        <AlertCircle className="h-8 w-8 text-red-600" />
      </div>
      <h3 className="text-lg font-semibold text-red-900">{title}</h3>
      <p className="mt-1 text-sm text-red-700 max-w-md">{message}</p>
      {onRetry && (
        <Button 
          variant="outline" 
          className="mt-6 border-red-200 text-red-700 hover:bg-red-100"
          onClick={onRetry}
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      )}
    </div>
  );
}
