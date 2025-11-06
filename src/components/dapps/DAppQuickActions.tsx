'use client';

import { useRouter } from 'next/navigation';
import { MyDApp } from '@/hooks/useMyDApps';

interface DAppQuickActionsProps {
  dapp: MyDApp;
}

export function DAppQuickActions({ dapp }: DAppQuickActionsProps) {
  const router = useRouter();
  const slug = dapp.slug || dapp.id;

  return (
    <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
      <button
        onClick={() => router.push(`/dapps/${slug}`)}
        className="px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
      >
        👁️ View
      </button>
      <button
        onClick={() => router.push(`/dapps/${slug}/edit`)}
        className="px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
      >
        ✏️ Edit
      </button>
      {dapp.contractAddress && (
        <button
          onClick={() => {
            // Navigate to subscription management for this dApp
            // This would be handled by the parent component or router
          }}
          className="px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
        >
          🔔 Subscriptions
        </button>
      )}
      <button
        onClick={() => {
          // Navigate to analytics for this dApp
        }}
        className="px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
      >
        📊 Analytics
      </button>
    </div>
  );
}

