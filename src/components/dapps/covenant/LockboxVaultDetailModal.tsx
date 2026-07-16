'use client';

import { useEffect } from 'react';
import { KxDataTable, type KxDataTableRow } from '@/components/kx/KxDataTable';
import type { KpxCovenantMetadataInstance, KpxCovenantMetadataRow } from '@/lib/covenant/kpxCovenantMetadata';

function toTableRows(rows: KpxCovenantMetadataRow[]): KxDataTableRow[] {
  return rows.map((row) => ({
    label: row.label,
    value: row.value,
    mono: row.mono,
    hint: row.hint,
    links: row.links,
  }));
}

export function LockboxVaultDetailModal({
  instance,
  onClose,
}: {
  instance: KpxCovenantMetadataInstance;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 p-3 sm:items-center"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="lockbox-vault-detail-title"
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl border border-zinc-200 bg-white p-4 shadow-xl dark:border-zinc-700 dark:bg-zinc-900 sm:p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3
              id="lockbox-vault-detail-title"
              className="text-base font-semibold text-zinc-900 dark:text-zinc-100"
            >
              {instance.title}
            </h3>
            {instance.subtitle ? (
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{instance.subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            Close
          </button>
        </div>
        <KxDataTable rows={toTableRows(instance.rows)} />
      </div>
    </div>
  );
}
