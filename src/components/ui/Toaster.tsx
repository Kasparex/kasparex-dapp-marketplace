'use client';

import * as React from 'react';
import * as Toast from '@radix-ui/react-toast';
import { createContext, useCallback, useContext, useState } from 'react';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface ToastData {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  duration?: number;
}

interface ToastContextValue {
  toasts: ToastData[];
  toast: (options: Omit<ToastData, 'id'>) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let toastId = 0;
function nextId() {
  return `toast-${++toastId}-${Date.now()}`;
}

export function ToasterProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (options: Omit<ToastData, 'id'>) => {
      const id = nextId();
      const duration = options.duration ?? 5000;
      setToasts((prev) => [...prev, { ...options, id, duration }]);
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      <Toast.Provider>
        {children}
        <Toast.Viewport
          className="fixed top-0 right-0 z-[100] flex max-h-screen w-full flex-col gap-2 p-4 sm:max-w-[380px] outline-none"
        />
        {toasts.map((t) => (
          <ToastItem key={t.id} data={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </Toast.Provider>
    </ToastContext.Provider>
  );
}

function ToastItem({ data, onDismiss }: { data: ToastData; onDismiss: () => void }) {
  const variantStyles: Record<ToastVariant, string> = {
    success: 'border-green-500/50 bg-green-50 dark:bg-green-950/30 dark:border-green-500/30',
    error: 'border-red-500/50 bg-red-50 dark:bg-red-950/30 dark:border-red-500/30',
    warning: 'border-amber-500/50 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-500/30',
    info: 'border-blue-500/50 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-500/30',
    loading: 'border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900',
  };

  return (
    <Toast.Root
      duration={data.duration ?? 5000}
      onOpenChange={(open) => {
        if (!open) onDismiss();
      }}
      className={`rounded-lg border shadow-lg p-4 ${variantStyles[data.variant]}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <Toast.Title className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {data.title}
          </Toast.Title>
          {data.description && (
            <Toast.Description className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
              {data.description}
            </Toast.Description>
          )}
        </div>
        <Toast.Close
          className="shrink-0 rounded p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 outline-none"
          aria-label="Close"
        >
          <span className="sr-only">Close</span>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 1l12 12M13 1L1 13" />
          </svg>
        </Toast.Close>
      </div>
    </Toast.Root>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToasterProvider');
  }
  return ctx;
}
