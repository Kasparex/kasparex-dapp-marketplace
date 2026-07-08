'use client';

import { KxModalShell } from '@/components/ui/KxModalShell';

type GenesisDeleteMessageModalProps = {
  isOpen: boolean;
  isDeleting?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function GenesisDeleteMessageModal({
  isOpen,
  isDeleting = false,
  onClose,
  onConfirm,
}: GenesisDeleteMessageModalProps) {
  return (
    <KxModalShell isOpen={isOpen} onClose={onClose} labelledBy="capsule-delete-title">
      <div className="p-6 space-y-4">
        <h2 id="capsule-delete-title" className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Delete message from Hub?
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          This removes the message from the Kaspa Capsule archive in the Hub interface only. Your on-chain
          transaction and payload remain on Kaspa L1 and cannot be deleted from the blockchain.
        </p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="k-control-btn !border-zinc-300 dark:!border-zinc-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="k-control-btn !border-red-600 !bg-red-600 !text-white hover:!bg-red-700 disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Delete from Hub'}
          </button>
        </div>
      </div>
    </KxModalShell>
  );
}
