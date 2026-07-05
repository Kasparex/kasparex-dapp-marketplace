'use client';

export interface TransactionErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  title?: string;
}

export function TransactionErrorModal({
  isOpen,
  onClose,
  message,
  title = 'Transaction failed',
}: TransactionErrorModalProps) {
  if (!isOpen) return null;

  return (
    <div className="kx-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" aria-hidden onClick={onClose} />
      <div
        className="kx-modal-panel relative w-full max-w-md rounded-xl border border-red-200 dark:border-red-800 bg-white dark:bg-zinc-900 shadow-xl p-6 space-y-4"
        role="alertdialog"
        aria-labelledby="tx-error-title"
        aria-describedby="tx-error-desc"
        aria-modal="true"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
            <svg className="h-5 w-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 id="tx-error-title" className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {title}
          </h2>
        </div>

        <p id="tx-error-desc" className="text-sm text-zinc-600 dark:text-zinc-400">
          {message}
        </p>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-red-600 dark:bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
