'use client';

import { KX_FORM_PANEL } from '@/lib/hub/shellTokens';

/** Lightweight skeleton while a dApp widget chunk loads. */
export function DAppWidgetLoading() {
  return (
    <div className={`${KX_FORM_PANEL} animate-pulse space-y-5`} aria-busy="true" aria-label="Loading dApp widget">
      <div className="flex flex-wrap gap-2">
        <div className="h-6 w-16 rounded-md bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-6 w-28 rounded-md bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <div className="space-y-3">
        <div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-10 w-full rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <div className="space-y-3">
        <div className="h-4 w-40 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-24 w-full rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <div className="h-11 w-full rounded-lg bg-zinc-200/80 dark:bg-zinc-800/80" />
    </div>
  );
}
