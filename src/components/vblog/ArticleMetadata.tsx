'use client';

import { VBlogArticle } from '@/lib/vblog/types';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useAccount } from 'wagmi';
import { getReceiptStreakAndBadge } from '@/lib/vblog/modules';
import { HubMetadataStatGrid } from '@/components/hub/HubMetadataStatGrid';

interface ArticleMetadataProps {
  article: VBlogArticle;
}

export function ArticleMetadata({ article }: ArticleMetadataProps) {
  const { state: kaspaState } = useKaspaWallet();
  const { address: evmAddress } = useAccount();
  const walletAddress = kaspaState.address || (evmAddress ? `evm:${evmAddress}` : '');
  const receiptBadge = walletAddress
    ? getReceiptStreakAndBadge(walletAddress)
    : { streak: 0, badge: 'No badge' };

  return (
    <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        <svg
          className="h-5 w-5 text-[color:var(--hub-accent)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        On-chain Metadata
      </h3>

      <HubMetadataStatGrid
        stats={[
          { label: 'Article ID', value: article.articleId || 'N/A', mono: true },
          { label: 'Content CID', value: article.cid || 'N/A', mono: true },
          { label: 'Transaction Hash', value: article.txHash || 'N/A', mono: true },
          {
            label: 'Reader streak',
            value: receiptBadge.badge,
            hint: `${receiptBadge.streak} day streak`,
            copyable: false,
          },
        ]}
        footer={
          <p className="mt-4 text-xs text-zinc-600 dark:text-zinc-400">
            Article content is referenced by CID on decentralized storage and anchored on-chain so
            verifiability stays high while storage costs stay low.
          </p>
        }
      />
    </div>
  );
}
