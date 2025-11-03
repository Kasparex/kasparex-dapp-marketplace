'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { DApp, type DAppStatus } from '@/lib/dapps';
import { getCategoryById } from '@/lib/categories';
import { DAppWidget } from './DAppWidget';
import { usePageViews } from '@/hooks/usePageViews';
import { generateDAppSlug } from '@/lib/utils';

const statusColors: Record<DAppStatus, string> = {
  Mainnet: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700',
  Testnet: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700',
  Concept: 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-700',
  Prototype: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-700',
  'U/C': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700',
  Suspended: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700',
  Devnet: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-700',
};

const statusEmojis: Record<DAppStatus, string> = {
  Concept: '⚪',
  Prototype: '🟠',
  Testnet: '🟡',
  Mainnet: '🟢',
  Devnet: '🟣',
  'U/C': '🔵',
  Suspended: '🔴',
};

interface DAppDetailProps {
  dapp: DApp;
}

export function DAppDetail({ dapp }: DAppDetailProps) {
  const router = useRouter();
  const category = getCategoryById(dapp.category);
  const slug = dapp.slug || generateDAppSlug(dapp.name);
  const pageViews = usePageViews(slug);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start gap-6">
        {dapp.image ? (
          <div className="flex-shrink-0 relative w-20 h-20 rounded-lg bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
            <Image
              src={dapp.image}
              alt={dapp.name}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        ) : (
          <div className="flex-shrink-0 w-20 h-20 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <span className="text-4xl">{category?.emoji || '⚡'}</span>
          </div>
        )}

        <div className="flex-1">
          <div className="flex items-start justify-between gap-4 mb-2">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              {dapp.name}
            </h1>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>{pageViews} views</span>
              </div>
              <span
                className={`
                  px-3 py-1 text-sm font-medium rounded border
                  flex items-center gap-2
                  ${statusColors[dapp.status] || statusColors.Concept}
                `}
              >
                {statusEmojis[dapp.status] && <span>{statusEmojis[dapp.status]}</span>}
                <span>{dapp.status}</span>
              </span>
            </div>
          </div>

          {category && (
            <div className="flex items-center gap-2 flex-wrap mb-4">
              <span className="text-xl">{category.emoji}</span>
              <button
                onClick={() => {
                  router.push(`/?category=${dapp.category}`);
                }}
                className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors text-left"
              >
                {category.name}
              </button>
              <span className="text-zinc-400 dark:text-zinc-600">•</span>
              <span className="text-sm text-zinc-500 dark:text-zinc-500">
                ID: {dapp.id}
                {dapp.version && ` • ${dapp.version} • ${dapp.provider} • ${dapp.network}`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* dApp Widget */}
      <div className="mt-6">
        <DAppWidget dapp={dapp} />
      </div>
    </div>
  );
}

