'use client';

import { Avatar } from '@/components/Avatar';
import { Tooltip } from '@/components/ui/Tooltip';

export function WalletAddressRow({
  address,
  displayAddress,
  onCopy,
  onOpenExplorer,
  onProfile,
  onRefresh,
  explorerLabel = 'View on explorer',
  copyLabel = 'Copy address',
  profileLabel = 'Profile',
  refreshLabel = 'Refresh',
}: {
  address: string;
  displayAddress: string;
  onCopy: () => void | Promise<void>;
  onOpenExplorer?: () => void;
  onProfile?: () => void;
  onRefresh?: () => void | Promise<void>;
  explorerLabel?: string;
  copyLabel?: string;
  profileLabel?: string;
  refreshLabel?: string;
}) {
  return (
    <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
      <Avatar address={address} size={24} />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-mono text-zinc-900 dark:text-zinc-100 truncate">
          {displayAddress}
        </div>
      </div>
      <div className="flex items-center gap-1">
        {onProfile ? (
          <Tooltip content={profileLabel}>
            <button
              type="button"
              onClick={onProfile}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label={profileLabel}
            >
              <svg className="w-4 h-4 text-zinc-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
          </Tooltip>
        ) : null}
        {onRefresh ? (
          <Tooltip content={refreshLabel}>
            <button
              type="button"
              onClick={onRefresh}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label={refreshLabel}
            >
              {/* Refresh */}
              <svg className="w-4 h-4 text-zinc-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-2.64-6.36M21 3v6h-6" />
              </svg>
            </button>
          </Tooltip>
        ) : null}
        <button
          type="button"
          onClick={onCopy}
          className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label={copyLabel}
          title={copyLabel}
        >
          <svg className="w-4 h-4 text-zinc-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
        {onOpenExplorer ? (
          <Tooltip content={explorerLabel}>
            <button
              type="button"
              onClick={onOpenExplorer}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label={explorerLabel}
            >
              {/* External link */}
              <svg className="w-4 h-4 text-zinc-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8L10 18m-4-4v5a2 2 0 002 2h5" />
              </svg>
            </button>
          </Tooltip>
        ) : null}
      </div>
    </div>
  );
}

