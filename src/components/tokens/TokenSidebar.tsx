'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import type { Token } from '@/lib/tokens/types';
import { TokenLogo } from './TokenLogo';
import { TokenTitle } from './TokenTitle';
import { TokenNetworkChips } from './TokenNetworkChips';
import { TokenListingBadges } from './TokenListingBadges';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { SidebarHeader } from '@/components/sidebar/SidebarHeader';
import { SidebarSection } from '@/components/sidebar/SidebarSection';
import { SidebarNavItem } from '@/components/sidebar/SidebarNavItem';
import type { TokenContentTab } from './TokenDetail';
import type { TokenPageConfig } from '@/lib/tokens/listingRecord';
import { getOrderedTabs } from '@/lib/tokens/pageConfig';
import {
  IconTokenAuthor,
  IconTokenComments,
  IconTokenMarkets,
  IconTokenOverview,
  IconTokenRoadmap,
  IconTokenShop,
  IconTokenSwap,
  IconTokenUtility,
} from '@/components/tokens/icons/TokenTabIcons';
import { formatLargeNumber } from '@/lib/rewards/calculator';
import { tokenHasModule } from '@/lib/tokens/modules';

interface TokenSidebarProps {
  token: Token;
  activeTab?: TokenContentTab;
  onNavClick?: (itemId: string) => void;
  showSwap?: boolean;
  showUtility?: boolean;
  pageConfig?: TokenPageConfig;
}

const TAB_NAV: Record<TokenContentTab, { id: string; label: string }> = {
  overview: { id: 'token-overview', label: 'Overview' },
  roadmap: { id: 'token-roadmap', label: 'Roadmap' },
  markets: { id: 'token-markets', label: 'Markets' },
  swap: { id: 'token-swap', label: 'Swap' },
  utility: { id: 'token-utility', label: 'Utility' },
  shop: { id: 'token-shop', label: 'Shop' },
  author: { id: 'token-author', label: 'vBlog Author' },
  comments: { id: 'token-comments', label: 'Comments' },
};

const TAB_ICONS: Record<TokenContentTab, ReactNode> = {
  overview: <IconTokenOverview />,
  roadmap: <IconTokenRoadmap />,
  markets: <IconTokenMarkets />,
  swap: <IconTokenSwap />,
  utility: <IconTokenUtility />,
  shop: <IconTokenShop />,
  author: <IconTokenAuthor />,
  comments: <IconTokenComments />,
};

export function TokenSidebar({
  token,
  activeTab = 'overview',
  onNavClick,
  showSwap = false,
  showUtility = false,
  pageConfig,
}: TokenSidebarProps) {
  const price = token.price?.current;
  const priceChange24h = token.price?.change24h;
  const showShop =
    Boolean(pageConfig?.sections.some((s) => s.type === 'shop' && s.enabled)) ||
    tokenHasModule(token.paidModuleIds, 'creator_showcase');
  const showAuthor =
    Boolean(pageConfig?.sections.some((s) => s.type === 'author' && s.enabled)) ||
    tokenHasModule(token.paidModuleIds, 'creator_showcase');

  const orderedTabs = (() => {
    const base = getOrderedTabs(pageConfig);
    const next = [...base];
    const insertBeforeComments = (tab: TokenContentTab) => {
      if (next.includes(tab)) return;
      const idx = next.indexOf('comments');
      next.splice(idx >= 0 ? idx : next.length, 0, tab);
    };
    if (showShop) insertBeforeComments('shop');
    if (showAuthor) insertBeforeComments('author');
    return next;
  })();
  const navItems: { id: string; label: string; tab: TokenContentTab }[] = orderedTabs
    .filter((tab) => {
      if (tab === 'swap' && !showSwap) return false;
      if (tab === 'utility' && !showUtility) return false;
      if (tab === 'shop' && !showShop) return false;
      if (tab === 'author' && !showAuthor) return false;
      return true;
    })
    .map((tab) => ({ ...TAB_NAV[tab], tab }));

  return (
    <UnifiedSidebar
      storageKeyPrefix={`token-${token.slug}`}
      header={(onHide) => (
        <SidebarHeader backHref="/tokens" backLabel="Back to Tokens" onHide={onHide} className="bg-white dark:bg-zinc-950" />
      )}
      defaultWidth={280}
    >
      <div className="mb-6">
        <Link href="/tokens/dashboard" className="k-control-btn w-full justify-center gap-2">
          <svg className="w-4 h-4 shrink-0 text-zinc-800 dark:text-zinc-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Dashboard
        </Link>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <TokenLogo token={token} size={48} showName={false} showSymbol={false} shape="rounded" className="flex-shrink-0" />
          <TokenTitle token={token} size="sm" layout="besideLogo" className="flex-1 min-w-0" />
        </div>
        <TokenNetworkChips token={token} />
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
          {navItems.map((section) => (
            <SidebarNavItem
              key={section.id}
              label={section.label}
              icon={TAB_ICONS[section.tab]}
              active={activeTab === section.tab}
              onClick={() => onNavClick?.(section.id)}
            />
          ))}
        </nav>
      </SidebarSection>
    </UnifiedSidebar>
  );
}
