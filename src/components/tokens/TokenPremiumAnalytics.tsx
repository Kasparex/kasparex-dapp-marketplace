'use client';

import type { Token } from '@/lib/tokens/types';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { getListingVoteScore } from '@/lib/tokens/votes';
import { getPollVotes } from '@/lib/tokens/votes';
import { tokenHasModule } from '@/lib/tokens/modules';
import { canUseIntegrationUtility } from '@/lib/tokens/utilityEligibility';

export function TokenPremiumAnalytics({ token }: { token: Token }) {
  if (!canUseIntegrationUtility(token) || !tokenHasModule(token.paidModuleIds, 'premium_analytics')) {
    return null;
  }

  const communityScore = token.listing?.communityScore ?? getListingVoteScore(token.id);
  const pollVotes = getPollVotes(token.slug).length;
  const activityScore = token.listing?.activityScore ?? 0;

  const metrics = [
    { label: 'Activity score', value: `${activityScore}/100` },
    { label: 'Community score', value: String(communityScore) },
    { label: 'Poll participation', value: String(pollVotes) },
    ...(token.totalSupply != null
      ? [{ label: 'Circulating supply', value: token.totalSupply.toLocaleString() }]
      : []),
  ];

  return (
    <section className="space-y-4">
      <DAppSectionHeader title="Premium analytics" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{metric.label}</p>
            <p className="mt-1 text-lg font-black tabular-nums text-zinc-900 dark:text-zinc-100">{metric.value}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Analytics refresh from listing activity, community votes, and on-chain snapshots.
      </p>
    </section>
  );
}
