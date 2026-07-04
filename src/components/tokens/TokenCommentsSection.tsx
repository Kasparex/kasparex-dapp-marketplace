'use client';

import Link from 'next/link';
import type { Token } from '@/lib/tokens/types';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { TokenHubUtilityPanel } from '@/components/tokens/TokenHubUtilityPanel';
import { TokenPremiumAnalytics } from '@/components/tokens/TokenPremiumAnalytics';
import { TokenCommunityPoll } from '@/components/tokens/TokenCommunityPoll';
import { tokenHasModule } from '@/lib/tokens/modules';
import { canUseIntegrationUtility } from '@/lib/tokens/utilityEligibility';
import { TOKENS_ACCENT } from '@/lib/tokens/theme';

export function TokenUtilitySection({ token }: { token: Token }) {
  const integrationReady = canUseIntegrationUtility(token);
  const hasUtilityModule =
    integrationReady && tokenHasModule(token.paidModuleIds, 'utility_integrations');
  const hasAnalytics = integrationReady && tokenHasModule(token.paidModuleIds, 'premium_analytics');
  const hasPoll = integrationReady && tokenHasModule(token.paidModuleIds, 'on_chain_poll');
  const showLiveUtility =
    hasUtilityModule || hasAnalytics || hasPoll || Boolean(integrationReady && token.listing?.instantUtility);

  if (!showLiveUtility) return null;

  return (
    <section id="token-utility" className="space-y-8">
      {hasUtilityModule || token.listing?.instantUtility ? <TokenHubUtilityPanel token={token} /> : null}
      {hasAnalytics ? <TokenPremiumAnalytics token={token} /> : null}
      {hasPoll ? <TokenCommunityPoll token={token} /> : null}
    </section>
  );
}
