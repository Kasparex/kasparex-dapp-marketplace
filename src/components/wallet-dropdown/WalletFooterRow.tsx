'use client';

import type { ReactNode } from 'react';

export function WalletFooterRow({
  left,
  right,
}: {
  left?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">{left}</div>
      <div className="flex items-center gap-2">{right}</div>
    </div>
  );
}

