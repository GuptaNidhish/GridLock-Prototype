'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle, AlertTriangle, Info, X, Shield, Zap } from 'lucide-react';

export type ToastSeverity = 'success' | 'warning' | 'critical' | 'info' | 'action';

interface Toast {
  id: string;
  message: string;
  severity: ToastSeverity;
  duration: number;
}

interface ToastContextType {
  showToast: (message: string, severity?: ToastSeverity, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

export const useToast = () => useContext(ToastContext);

const ICONS: Record<ToastSeverity, React.ReactNode> = {
  success: <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />,
  warning: <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />,
  critical: <Shield className="w-4 h-4 text-red-400 flex-shrink-0" />,
  info: <Info className="w-4 h-4 text-sky-400 flex-shrink-0" />,
  action: <Zap className="w-4 h-4 text-indigo-400 flex-shrink-0" />,
};

const BORDER_COLORS: Record<ToastSeverity, string> = {
  success: 'border-emerald-800/60',
  warning: 'border-yellow-800/60',
  critical: 'border-red-800/60',
  info: 'border-sky-800/60',
  action: 'border-indigo-800/60',
};

const GLOW_COLORS: Record<ToastSeverity, string> = {
  success: 'shadow-emerald-500/10',
  warning: 'shadow-yellow-500/10',
  critical: 'shadow-red-500/10',
  info: 'shadow-sky-500/10',
  action: 'shadow-indigo-500/10',
};

const ACCENT_COLORS: Record<ToastSeverity, string> = {
  success: 'bg-emerald-500',
  warning: 'bg-yellow-500',
  critical: 'bg-red-500',
  info: 'bg-sky-500',
  action: 'bg-indigo-500',
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, severity: ToastSeverity = 'info', duration = 4000) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const toast: Toast = { id, message, severity, duration };

    setToasts((prev) => [...prev, toast].slice(-6)); // max 6 toasts

    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      timersRef.current.delete(id);
    }, duration);

    timersRef.current.set(id, timer);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast Container — fixed bottom-left to avoid overlap with LiveFeed (bottom-right) */}
      <div className="fixed bottom-4 left-4 z-[200] flex flex-col space-y-2 max-w-md pointer-events-none">
        {toasts.map((toast, idx) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start space-x-2.5 px-4 py-3 rounded-lg border bg-slate-950/95 backdrop-blur-xl shadow-2xl ${BORDER_COLORS[toast.severity]} ${GLOW_COLORS[toast.severity]} animate-toast-in`}
            style={{
              animationDelay: `${idx * 50}ms`,
            }}
          >
            {/* Accent bar */}
            <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${ACCENT_COLORS[toast.severity]}`} />

            {/* Icon */}
            {ICONS[toast.severity]}

            {/* Message */}
            <p className="text-[11px] text-slate-200 leading-relaxed font-medium flex-1 whitespace-pre-line">
              {toast.message}
            </p>

            {/* Dismiss */}
            <button
              onClick={() => dismiss(toast.id)}
              className="p-0.5 hover:bg-slate-900 rounded text-slate-500 hover:text-slate-300 transition cursor-pointer flex-shrink-0"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Animation keyframes injected via style tag */}
      <style jsx global>{`
        @keyframes toast-in {
          0% {
            opacity: 0;
            transform: translateX(-20px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        .animate-toast-in {
          animation: toast-in 0.3s ease-out forwards;
        }
      `}</style>
    </ToastContext.Provider>
  );
};
