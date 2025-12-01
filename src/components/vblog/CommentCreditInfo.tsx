'use client';

import { useCommentCredits } from '@/hooks/useCommentCredits';
import { useKaspaWallet } from '@/lib/kaspa/context';

interface CommentCreditInfoProps {
  onPurchaseClick?: () => void;
}

export function CommentCreditInfo({ onPurchaseClick }: CommentCreditInfoProps) {
  const { state } = useKaspaWallet();
  const { credits, isLoading } = useCommentCredits(state.address);

  if (!state.isConnected || !state.address) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          Connect your wallet to view and use comment credits.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 mb-6">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading credits...</p>
      </div>
    );
  }

  const creditsRemaining = credits?.creditsRemaining || 0;
  const totalPurchased = credits?.totalPurchased || 0;
  const hasCredits = creditsRemaining > 0;

  return (
    <div className={`border rounded-lg p-4 mb-6 ${
      hasCredits
        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
        : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
    }`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            Comment Credits
          </h4>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-3">
            Users prepay a package (e.g., 10 KAS) to unlock comment slots (e.g., 10 comments). Each comment uses one credit.
          </p>
          <div className="flex items-center gap-4">
            <div>
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {creditsRemaining} / {totalPurchased} left
              </span>
            </div>
            {!hasCredits && (
              <button
                onClick={onPurchaseClick}
                className="px-3 py-1.5 text-xs font-medium bg-[#02abb8] hover:bg-[#028a94] text-white rounded-lg transition-colors"
              >
                Purchase Credits
              </button>
            )}
          </div>
        </div>
        <div className="flex-shrink-0">
          {hasCredits ? (
            <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}

