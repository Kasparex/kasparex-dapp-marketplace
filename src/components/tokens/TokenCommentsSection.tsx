'use client';

import Link from 'next/link';
import type { Token } from '@/lib/tokens/types';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { TokenHubUtilityPanel } from '@/components/tokens/TokenHubUtilityPanel';
import { TokenPremiumAnalytics } from '@/components/tokens/TokenPremiumAnalytics';
import { TokenCommunityPoll } from '@/components/tokens/TokenCommunityPoll';
import { TokenCovenantUtilitiesPanel } from '@/components/tokens/TokenCovenantUtilitiesPanel';
import { TokenAccessGatePanel } from '@/components/tokens/TokenAccessGatePanel';
import { TokenNativeSubscriptionsPanel } from '@/components/tokens/TokenNativeSubscriptionsPanel';
import { tokenHasModule } from '@/lib/tokens/modules';
import { canShowProgrammableUtilitySection } from '@/lib/programmable/eligibility';
import { canUseIntegrationUtility } from '@/lib/tokens/utilityEligibility';
import { TOKENS_ACCENT } from '@/lib/tokens/theme';

export function TokenUtilitySection({ token }: { token: Token }) {
  const integrationReady = canUseIntegrationUtility(token);
  const hasUtilityModule =
    integrationReady && tokenHasModule(token.paidModuleIds, 'utility_integrations');
  const hasAnalytics = integrationReady && tokenHasModule(token.paidModuleIds, 'premium_analytics');
  const hasPoll = integrationReady && tokenHasModule(token.paidModuleIds, 'on_chain_poll');
  const hasProgrammable = canShowProgrammableUtilitySection(token);
  const showLiveUtility =
    hasUtilityModule ||
    hasAnalytics ||
    hasPoll ||
    hasProgrammable ||
    Boolean(integrationReady && token.listing?.instantUtility);

  if (!showLiveUtility) return null;

  return (
    <section id="token-utility" className="space-y-8">
      {hasUtilityModule || token.listing?.instantUtility ? <TokenHubUtilityPanel token={token} /> : null}
      <TokenCovenantUtilitiesPanel token={token} />
      <TokenAccessGatePanel token={token} />
      <TokenNativeSubscriptionsPanel token={token} />
      {hasAnalytics ? <TokenPremiumAnalytics token={token} /> : null}
      {hasPoll ? <TokenCommunityPoll token={token} /> : null}
    </section>
  );
}
