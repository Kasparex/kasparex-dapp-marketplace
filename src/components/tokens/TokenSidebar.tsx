'use client';

import { useRouter } from 'next/navigation';
import type { Token } from '@/lib/tokens/types';
import { TokenLogo } from './TokenLogo';
import { TokenTitle } from './TokenTitle';
import { TokenListingMeta } from './TokenListingMeta';
import { TokenListingBadges } from './TokenListingBadges';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { SidebarHeader } from '@/components/sidebar/SidebarHeader';
import { SidebarTags } from '@/components/sidebar/SidebarTags';
import { getAllTokenTags } from '@/lib/tokens/tags';
import { getAllTokens } from '@/lib/tokens/registry';
import { formatLargeNumber } from '@/lib/rewards/calculator';

interface TokenSidebarProps {
  token: Token;
  selectedTags?: string[];
  onTagToggle?: (tag: string) => void;
}

export function TokenSidebar({
  token,
  selectedTags = [],
  onTagToggle,
}: TokenSidebarProps) {
  const router = useRouter();
  const price = token.price?.current;
  const priceChange24h = token.price?.change24h;
  const allTags = getAllTokenTags(getAllTokens());

  const handleTagToggle = (tag: string) => {
    if (onTagToggle) {
      onTagToggle(tag);
      return;
    }
    router.push(`/tokens?tag=${encodeURIComponent(tag)}`);
  };

  return (
    <UnifiedSidebar
      storageKeyPrefix={`token-${token.slug}`}
      header={(onHide) => (
        <SidebarHeader backHref="/tokens" backLabel="Back to Tokens" onHide={onHide} className="bg-white dark:bg-zinc-950" />
      )}
      defaultWidth={280}
    >
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <TokenLogo token={token} size={48} showName={false} showSymbol={false} shape="rounded" className="flex-shrink-0" />
          <TokenTitle token={token} size="sm" layout="besideLogo" className="flex-1 min-w-0" />
        </div>
        <TokenListingMeta token={token} />
        <TokenListingBadges token={token} />

        {price !== undefined && (
          <div className="border-t border-zinc-200 pt-3 dark:border-zinc-800">
            <div className="mb-1 text-xs text-zinc-500 dark:text-zinc-400">Price</div>
            <div className="flex items-center gap-2">
              <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
              </div>
              {priceChange24h !== undefined && (
                <div
                  className={`text-sm ${
                    priceChange24h >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {priceChange24h >= 0 ? '+' : ''}
                  {priceChange24h.toFixed(2)}%
                </div>
              )}
              {token.price?.marketCap !== undefined ? (
                <span className="ml-auto text-xs text-zinc-500">${formatLargeNumber(token.price.marketCap)} mcap</span>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {allTags.length > 0 ? (
        <SidebarTags
          title="Tags"
          tags={allTags}
          selectedTags={selectedTags.length > 0 ? selectedTags : (token.tags ?? [])}
          onToggle={handleTagToggle}
          className="mt-6"
        />
      ) : null}
    </UnifiedSidebar>
  );
}
