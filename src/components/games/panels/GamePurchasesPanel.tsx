'use client';

import type { ReactNode } from 'react';

export function GamePurchasesPanel(props: { title?: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/60">
      <p className="text-xs font-bold uppercase tracking-wider text-white">{props.title ?? 'Purchases'}</p>
      <div className="mt-3">{props.children}</div>
    </div>
  );
}

