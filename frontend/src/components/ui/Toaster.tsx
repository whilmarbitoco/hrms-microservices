import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: any;
  type: ToastType;
}

let toastCount = 0;
let observers: ((toasts: Toast[]) => void)[] = [];

export const toast = {
  success: (message: any) => addToast(message, 'success'),
  error: (message: any) => addToast(message, 'error'),
  info: (message: any) => addToast(message, 'info'),
  warning: (message: any) => addToast(message, 'warning'),
};

function addToast(message: any, type: ToastType) {
  const id = `toast-${toastCount++}`;
  const newToast = { id, message, type };
  const currentToasts = [...allToasts, newToast];
  updateToasts(currentToasts);
  
  setTimeout(() => {
    removeToast(id);
  }, 8000); // Increased timeout for debugging
}

function removeToast(id: string) {
  const currentToasts = allToasts.filter((t) => t.id !== id);
  updateToasts(currentToasts);
}

let allToasts: Toast[] = [];
function updateToasts(toasts: Toast[]) {
  allToasts = toasts;
  observers.forEach((cb) => cb(toasts));
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    observers.push(setToasts);
    return () => {
      observers = observers.filter((cb) => cb !== setToasts);
    };
  }, []);

  const renderMessage = (message: any) => {
    if (typeof message === 'string') return message;
    try {
      return (
        <pre className="mt-1 max-h-32 overflow-auto text-[10px] bg-black/5 p-1 rounded font-mono whitespace-pre-wrap">
          {JSON.stringify(message, null, 2)}
        </pre>
      );
    } catch (e) {
      return String(message);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
              "flex items-start gap-3 rounded-lg border p-4 shadow-lg w-full bg-paper-raised",
              t.type === 'success' && "border-success-base/30 text-success-base",
              t.type === 'error' && "border-error-base/30 text-error-base",
              t.type === 'info' && "border-accent-base/30 text-accent-base",
              t.type === 'warning' && "border-warning-base/30 text-warning-base"
            )}
          >
            <div className="mt-0.5">
              {t.type === 'success' && <CheckCircle className="h-5 w-5" />}
              {t.type === 'error' && <AlertCircle className="h-5 w-5" />}
              {t.type === 'info' && <Info className="h-5 w-5" />}
              {t.type === 'warning' && <AlertCircle className="h-5 w-5" />}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold">
                {t.type.charAt(0).toUpperCase() + t.type.slice(1)}
              </div>
              <div className="text-xs text-ink-muted font-medium mt-0.5">
                {renderMessage(t.message)}
              </div>
            </div>
            
            <button
              onClick={() => removeToast(t.id)}
              className="rounded-md p-1 hover:bg-paper-sunken text-ink-faint hover:text-ink-base transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
