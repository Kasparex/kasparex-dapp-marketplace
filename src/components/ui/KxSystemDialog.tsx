'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { KxModalShell } from '@/components/ui/KxModalShell';

export type KxConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

export type KxAlertOptions = {
  title: string;
  message: string;
  okLabel?: string;
};

type PendingDialog =
  | { kind: 'confirm'; options: KxConfirmOptions; resolve: (value: boolean) => void }
  | { kind: 'alert'; options: KxAlertOptions; resolve: () => void };

type KxSystemDialogContextValue = {
  confirm: (options: KxConfirmOptions) => Promise<boolean>;
  alert: (options: KxAlertOptions) => Promise<void>;
};

const KxSystemDialogContext = createContext<KxSystemDialogContextValue | null>(null);

function KxSystemDialogView({
  dialog,
  onDismiss,
}: {
  dialog: PendingDialog;
  onDismiss: (result: boolean) => void;
}) {
  const titleId = 'kx-system-dialog-title';
  const dismiss = (result: boolean) => onDismiss(result);

  if (dialog.kind === 'alert') {
    const { title, message, okLabel = 'OK' } = dialog.options;
    return (
      <KxModalShell
        isOpen
        labelledBy={titleId}
        onClose={() => dismiss(true)}
        closeOnBackdrop={false}
      >
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
          <span
            className="h-6 w-1 shrink-0 rounded-full bg-[#02abb8] shadow-[0_0_12px_rgba(2,171,184,0.35)] -skew-y-12"
            aria-hidden
          />
          <h2 id={titleId} className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            {title}
          </h2>
        </div>
        <div className="p-5 space-y-5">
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{message}</p>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => dismiss(true)}
              className="rounded-xl bg-[#02abb8] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            >
              {okLabel}
            </button>
          </div>
        </div>
      </KxModalShell>
    );
  }

  const { title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', destructive = false } =
    dialog.options;

  return (
    <KxModalShell
      isOpen
      labelledBy={titleId}
      onClose={() => dismiss(false)}
      closeOnBackdrop={false}
    >
      <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
        <span
          className={`h-6 w-1 shrink-0 rounded-full -skew-y-12 ${
            destructive
              ? 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.35)]'
              : 'bg-[#02abb8] shadow-[0_0_12px_rgba(2,171,184,0.35)]'
          }`}
          aria-hidden
        />
        <h2 id={titleId} className="text-base font-bold text-zinc-900 dark:text-zinc-100">
          {title}
        </h2>
      </div>
      <div className="p-5 space-y-5">
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{message}</p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => dismiss(false)}
            className="rounded-xl border border-zinc-200 dark:border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => dismiss(true)}
            className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 ${
              destructive
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-[#02abb8]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </KxModalShell>
  );
}

export function KxSystemDialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<PendingDialog | null>(null);
  const dialogRef = useRef<PendingDialog | null>(null);

  const closeDialog = useCallback(() => {
    setDialog(null);
    dialogRef.current = null;
  }, []);

  const dismissDialog = useCallback(
    (result: boolean) => {
      const pending = dialogRef.current;
      if (!pending) return;
      if (pending.kind === 'confirm') {
        pending.resolve(result);
      } else if (result) {
        pending.resolve();
      }
      closeDialog();
    },
    [closeDialog],
  );

  const confirm = useCallback((options: KxConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      const pending: PendingDialog = { kind: 'confirm', options, resolve };
      dialogRef.current = pending;
      setDialog(pending);
    });
  }, []);

  const alert = useCallback((options: KxAlertOptions) => {
    return new Promise<void>((resolve) => {
      const pending: PendingDialog = { kind: 'alert', options, resolve };
      dialogRef.current = pending;
      setDialog(pending);
    });
  }, []);

  const value = useMemo(() => ({ confirm, alert }), [confirm, alert]);

  return (
    <KxSystemDialogContext.Provider value={value}>
      {children}
      {dialog ? <KxSystemDialogView dialog={dialog} onDismiss={dismissDialog} /> : null}
    </KxSystemDialogContext.Provider>
  );
}

export function useKxSystemDialog(): KxSystemDialogContextValue {
  const ctx = useContext(KxSystemDialogContext);
  if (!ctx) {
    throw new Error('useKxSystemDialog must be used within KxSystemDialogProvider');
  }
  return ctx;
}
