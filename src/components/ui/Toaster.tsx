'use client';

import * as React from 'react';
import * as Toast from '@radix-ui/react-toast';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { bindHubNotifyApi } from '@/lib/hub/notifyBridge';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface ToastActionLink {
  href: string;
  label?: string;
}

export interface ToastData {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  /** Auto-dismiss ms. `0` stays until the user clicks x (Hub default for all variants). */
  duration?: number;
  /** Shortened explorer / external link shown in accent color. */
  href?: string;
  linkLabel?: string;
}

export type ToastInput = Omit<ToastData, 'id'> & { id?: string };

interface ToastContextValue {
  toasts: ToastData[];
  toast: (options: ToastInput) => string;
  update: (id: string, options: Partial<Omit<ToastData, 'id'>>) => void;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION: Record<ToastVariant, number> = {
  success: 0,
  error: 0,
  warning: 0,
  info: 0,
  loading: 0,
};

let toastId = 0;
function nextId() {
  return `toast-${++toastId}-${Date.now()}`;
}

const VARIANT_SHELL: Record<ToastVariant, string> = {
  success:
    'border-emerald-500/25 bg-zinc-950/95 shadow-[0_0_24px_-10px_rgba(16,185,129,0.55)] dark:bg-zinc-950/95',
  error:
    'border-rose-500/25 bg-zinc-950/95 shadow-[0_0_24px_-10px_rgba(244,63,94,0.45)] dark:bg-zinc-950/95',
  warning:
    'border-amber-500/30 bg-zinc-950/95 shadow-[0_0_24px_-10px_rgba(245,158,11,0.45)] dark:bg-zinc-950/95',
  info:
    'border-sky-500/25 bg-zinc-950/95 shadow-[0_0_24px_-10px_rgba(14,165,233,0.45)] dark:bg-zinc-950/95',
  loading:
    'border-sky-500/25 bg-zinc-950/95 shadow-[0_0_24px_-10px_rgba(14,165,233,0.4)] dark:bg-zinc-950/95',
};

const VARIANT_ACCENT: Record<ToastVariant, string> = {
  success: 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.75)]',
  error: 'bg-rose-400 shadow-[0_0_12px_rgba(251,113,133,0.7)]',
  warning: 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.7)]',
  info: 'bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.7)]',
  loading: 'bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.7)]',
};

const VARIANT_ICON_WRAP: Record<ToastVariant, string> = {
  success: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
  error: 'bg-rose-500/15 text-rose-300 border-rose-500/25',
  warning: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
  info: 'bg-sky-500/15 text-sky-300 border-sky-500/25',
  loading: 'bg-sky-500/15 text-sky-300 border-sky-500/25',
};

const VARIANT_LINK: Record<ToastVariant, string> = {
  success: 'text-emerald-300 hover:text-emerald-200',
  error: 'text-rose-300 hover:text-rose-200',
  warning: 'text-amber-300 hover:text-amber-200',
  info: 'text-sky-300 hover:text-sky-200',
  loading: 'text-sky-300 hover:text-sky-200',
};

function VariantIcon({ variant }: { variant: ToastVariant }) {
  const cls = 'h-4 w-4';
  if (variant === 'loading') {
    return (
      <svg className={`${cls} animate-spin`} viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
        <path
          className="opacity-90"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z"
        />
      </svg>
    );
  }
  if (variant === 'success') {
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    );
  }
  if (variant === 'error') {
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    );
  }
  if (variant === 'warning') {
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
        />
      </svg>
    );
  }
  return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

export function ToasterProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const timersRef = React.useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const clearTimer = useCallback((id: string) => {
    const t = timersRef.current.get(id);
    if (t) {
      clearTimeout(t);
      timersRef.current.delete(id);
    }
  }, []);

  const dismiss = useCallback(
    (id: string) => {
      clearTimer(id);
      setToasts((prev) => prev.filter((t) => t.id !== id));
    },
    [clearTimer],
  );

  const dismissAll = useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current.clear();
    setToasts([]);
  }, []);

  const scheduleDismiss = useCallback(
    (id: string, duration: number) => {
      clearTimer(id);
      if (duration > 0) {
        timersRef.current.set(
          id,
          setTimeout(() => dismiss(id), duration),
        );
      }
    },
    [clearTimer, dismiss],
  );

  const toast = useCallback(
    (options: ToastInput) => {
      const id = options.id ?? nextId();
      const variant = options.variant ?? 'info';
      const duration = options.duration ?? DEFAULT_DURATION[variant];
      const entry: ToastData = {
        id,
        title: options.title,
        description: options.description,
        variant,
        duration,
        href: options.href,
        linkLabel: options.linkLabel,
      };
      setToasts((prev) => {
        const without = prev.filter((t) => t.id !== id);
        return [...without, entry].slice(-5);
      });
      scheduleDismiss(id, duration);
      return id;
    },
    [scheduleDismiss],
  );

  const update = useCallback(
    (id: string, options: Partial<Omit<ToastData, 'id'>>) => {
      setToasts((prev) => {
        const existing = prev.find((t) => t.id === id);
        if (!existing) return prev;
        const variant = options.variant ?? existing.variant;
        const duration =
          options.duration !== undefined
            ? options.duration
            : options.variant
              ? DEFAULT_DURATION[options.variant]
              : existing.duration ?? DEFAULT_DURATION[variant];
        const next: ToastData = {
          ...existing,
          ...options,
          id,
          variant,
          duration,
        };
        scheduleDismiss(id, duration);
        return prev.map((t) => (t.id === id ? next : t));
      });
    },
    [scheduleDismiss],
  );

  useEffect(() => {
    bindHubNotifyApi({ toast, update, dismiss, dismissAll });
    return () => bindHubNotifyApi(null);
  }, [toast, update, dismiss, dismissAll]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, update, dismiss, dismissAll }}>
      <Toast.Provider swipeDirection="right" duration={5000}>
        {children}
        <Toast.Viewport className="kx-notify-viewport fixed bottom-0 right-0 z-[120] flex max-h-screen w-full flex-col-reverse gap-2.5 p-4 outline-none sm:max-w-[380px]" />
        {toasts.map((t) => (
          <ToastItem key={t.id} data={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </Toast.Provider>
    </ToastContext.Provider>
  );
}

function ToastItem({ data, onDismiss }: { data: ToastData; onDismiss: () => void }) {
  return (
    <Toast.Root
      duration={data.duration === 0 ? Infinity : (data.duration ?? 5000)}
      onOpenChange={(open) => {
        if (!open) onDismiss();
      }}
      className={[
        'kx-notify-toast group relative overflow-hidden rounded-xl border px-3.5 py-3',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[swipe=end]:animate-out data-[state=closed]:fade-out-80',
        'data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-bottom-full',
        'data-[state=open]:sm:slide-in-from-bottom-full',
        VARIANT_SHELL[data.variant],
      ].join(' ')}
    >
      <span
        aria-hidden
        className={`absolute inset-y-2 right-0 w-[3px] rounded-full ${VARIANT_ACCENT[data.variant]}`}
      />
      <div className="flex items-start gap-3 pr-1">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${VARIANT_ICON_WRAP[data.variant]}`}
        >
          <VariantIcon variant={data.variant} />
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <Toast.Title className="text-sm font-semibold leading-snug text-zinc-50">
            {data.title}
          </Toast.Title>
          {data.description ? (
            <Toast.Description className="mt-0.5 text-xs leading-relaxed text-zinc-400">
              {data.description}
            </Toast.Description>
          ) : null}
          {data.href ? (
            <a
              href={data.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`mt-1.5 inline-flex items-center gap-1 text-xs font-medium underline-offset-2 hover:underline ${VARIANT_LINK[data.variant]}`}
            >
              {data.linkLabel || shortenHrefLabel(data.href)}
              <svg className="h-3 w-3 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          ) : null}
        </div>
        <Toast.Close
          className="shrink-0 rounded-md p-1 text-zinc-500 outline-none transition-colors hover:bg-white/10 hover:text-zinc-200"
          aria-label="Close"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M1 1l12 12M13 1L1 13" />
          </svg>
        </Toast.Close>
      </div>
    </Toast.Root>
  );
}

function shortenHrefLabel(href: string): string {
  try {
    const u = new URL(href);
    const last = u.pathname.split('/').filter(Boolean).pop() || u.hostname;
    if (last.length <= 14) return last;
    return `${last.slice(0, 8)}…${last.slice(-4)}`;
  } catch {
    return 'Open link';
  }
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToasterProvider');
  }
  return ctx;
}
