'use client';

import type { Token } from '@/lib/tokens/types';
import type { TokenPageConfig } from '@/lib/tokens/listingRecord';
import { TokenSidebar } from './TokenSidebar';
import { TokenDetail, type TokenContentTab } from './TokenDetail';
import { canShowUtilityTab } from '@/lib/tokens/utilityEligibility';
import { HubPageAccentLayout } from '@/components/hub/HubPageAccentLayout';
import { HUB_MAIN_COLUMN, HUB_MAIN_INNER } from '@/lib/hub/hubLayout';
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
    <HubPageAccentLayout projectId="kasparex-tokens">
      <TokenSidebar
        token={token}
        activeTab={contentTab}
        onNavClick={handleTokenNavClick}
        showSwap={showSwap}
        showUtility={showUtility}
        pageConfig={pageConfig}
      />

      <div className={HUB_MAIN_COLUMN}>
        <div className={`${HUB_MAIN_INNER} max-w-6xl`}>
          <TokenDetail
            token={token}
            contentTab={contentTab}
            onContentTabChange={setContentTab}
            pageConfig={pageConfig}
          />
        </div>
      </div>
    </HubPageAccentLayout>
  );
}
