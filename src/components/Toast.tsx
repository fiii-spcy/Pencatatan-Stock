import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

// ─── Config per type ─────────────────────────────────────────────────────────
const TOAST_CONFIG: Record<ToastType, {
  icon: React.ReactNode;
  bg: string;
  border: string;
  text: string;
  iconColor: string;
}> = {
  success: {
    icon: <CheckCircle className="w-5 h-5 shrink-0" />,
    bg: 'bg-white',
    border: 'border-emerald-200',
    text: 'text-neutral-800',
    iconColor: 'text-emerald-500',
  },
  error: {
    icon: <XCircle className="w-5 h-5 shrink-0" />,
    bg: 'bg-white',
    border: 'border-rose-200',
    text: 'text-neutral-800',
    iconColor: 'text-rose-500',
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5 shrink-0" />,
    bg: 'bg-white',
    border: 'border-amber-200',
    text: 'text-neutral-800',
    iconColor: 'text-amber-500',
  },
  info: {
    icon: <Info className="w-5 h-5 shrink-0" />,
    bg: 'bg-white',
    border: 'border-blue-200',
    text: 'text-neutral-800',
    iconColor: 'text-blue-500',
  },
};

// ─── Single Toast Item ────────────────────────────────────────────────────────
const ToastItem: React.FC<{ toast: Toast; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  const config = TOAST_CONFIG[toast.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`flex items-start gap-3 px-4 py-3.5 rounded-2xl border shadow-lg shadow-black/5 max-w-sm w-full ${config.bg} ${config.border}`}
    >
      <span className={config.iconColor}>{config.icon}</span>
      <p className={`flex-1 text-sm font-medium leading-snug ${config.text}`}>{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-neutral-400 hover:text-neutral-600 transition-colors shrink-0 mt-0.5"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

// ─── Provider + Container ─────────────────────────────────────────────────────
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 3500) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev.slice(-3), { id, type, message, duration }]); // max 4 toasts

    const timer = setTimeout(() => dismiss(id), duration);
    timers.current.set(id, timer);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast Container — fixed top center */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 items-center pointer-events-none w-full px-4">
        <AnimatePresence mode="popLayout">
          {toasts.map(toast => (
            <div key={toast.id} className="pointer-events-auto w-full max-w-sm">
              <ToastItem toast={toast} onDismiss={dismiss} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
