'use client';

import type { Token } from '@/lib/tokens/types';
import type { TokenPageConfig } from '@/lib/tokens/listingRecord';
import { TokenSidebar } from './TokenSidebar';
import { TokenDetail, type TokenContentTab } from './TokenDetail';
import { canShowUtilityTab } from '@/lib/tokens/utilityEligibility';
import { HubAccentScope } from '@/components/hub/HubAccentScope';
import { useCallback, useState } from 'react';

interface TokenLandingPageProps {
  token: Token;
  pageConfig?: TokenPageConfig;
}

const TAB_NAV_IDS: Record<string, TokenContentTab> = {
  'token-overview': 'overview',
  'token-roadmap': 'roadmap',
  'token-markets': 'markets',
  'token-swap': 'swap',
  'token-utility': 'utility',
  'token-comments': 'comments',
};

function isFullyMinted(token: Token): boolean {
  if (!token.maxSupply || !token.circulatingSupply) return false;
  return token.circulatingSupply >= token.maxSupply;
}

export function TokenLandingPage({ token, pageConfig }: TokenLandingPageProps) {
  const [contentTab, setContentTab] = useState<TokenContentTab>('overview');

  const fullyMinted = isFullyMinted(token);
  const showSwap = fullyMinted || token.id === 'krex' || token.type === 'global';
  const showUtility = canShowUtilityTab(token);

  const handleTokenNavClick = useCallback((itemId: string) => {
    const tabTarget = TAB_NAV_IDS[itemId];
    if (tabTarget) {
      setContentTab(tabTarget);
      window.setTimeout(() => {
        document.getElementById(itemId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  }, []);

  return (
    <HubAccentScope projectId="kasparex-tokens" className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden bg-zinc-50 dark:bg-zinc-950 lg:flex-row">
      <TokenSidebar
        token={token}
        activeTab={contentTab}
        onNavClick={handleTokenNavClick}
        showSwap={showSwap}
        showUtility={showUtility}
        pageConfig={pageConfig}
      />

      <main className="min-h-[calc(100vh-4rem)] flex-1 min-w-0 overflow-x-hidden overflow-y-auto border-l border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto w-full min-w-0 max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:pl-6">
          <TokenDetail
            token={token}
            contentTab={contentTab}
            onContentTabChange={setContentTab}
            pageConfig={pageConfig}
          />
        </div>
      </main>
    </HubAccentScope>
  );
}
