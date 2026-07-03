'use client';

import type { Token } from '@/lib/tokens/types';
import { TokenLogo } from './TokenLogo';
import { TokenTitle } from './TokenTitle';
import { TokenListingMeta } from './TokenListingMeta';
import { TokenListingBadges } from './TokenListingBadges';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { SidebarHeader } from '@/components/sidebar/SidebarHeader';
import { SidebarSection } from '@/components/sidebar/SidebarSection';
import { SidebarNavItem } from '@/components/sidebar/SidebarNavItem';
import type { TokenContentTab } from './TokenDetail';
import { formatLargeNumber } from '@/lib/rewards/calculator';

interface TokenSidebarProps {
  token: Token;
  activeTab?: TokenContentTab;
  onNavClick?: (itemId: string) => void;
  showUtility?: boolean;
}

const navIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h6m-6 4h10" />
  </svg>
);

export function TokenSidebar({
  token,
  activeTab = 'info',
  onNavClick,
  showUtility = false,
}: TokenSidebarProps) {
  const price = token.price?.current;
  const priceChange24h = token.price?.change24h;

  const navItems: { id: string; label: string; tab: TokenContentTab }[] = [
    { id: 'token-header', label: 'Overview', tab: 'info' },
    { id: 'token-info', label: 'Token Info', tab: 'info' },
    { id: 'token-tokenomics', label: 'Tokenomics', tab: 'tokenomics' },
    { id: 'token-roadmap', label: 'Roadmap', tab: 'roadmap' },
    { id: 'token-markets', label: 'Markets', tab: 'markets' },
  ];

  if (showUtility) {
    navItems.push({ id: 'token-utility', label: 'Utility', tab: 'utility' });
  }

  navItems.push({ id: 'token-comments', label: 'Comments', tab: 'comments' });

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

      <SidebarSection title="Sections" className="mt-6 mb-0">
        <nav className="space-y-0.5">
          {navItems.map((section) => {
            if (section.id === 'token-roadmap' && !token.roadmap?.length) return null;

            return (
              <SidebarNavItem
                key={section.id}
                label={section.label}
                icon={navIcon}
                active={activeTab === section.tab}
                onClick={() => onNavClick?.(section.id)}
              />
            );
          })}
        </nav>
      </SidebarSection>
    </UnifiedSidebar>
  );
}
