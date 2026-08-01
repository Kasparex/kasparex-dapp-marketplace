/**
 * Tokenomics Section
 * Supply snapshot + distribution (locked Hub metadata boxes).
 */

'use client';

import type { Token } from '@/lib/tokens/types';
import { formatLargeNumber } from '@/lib/rewards/calculator';
import { GameOverviewTitleBlock } from '@/components/games/panels/GameOverviewSections';
import { HubMetadataStatGrid, type HubMetadataStat } from '@/components/hub/HubMetadataStatGrid';
import { KX_METADATA_STAT_CARD, metadataStatGridClassForCount } from '@/lib/hub/shellTokens';

interface TokenomicsSectionProps {
  token: Token;
}

export function TokenomicsSection({ token }: TokenomicsSectionProps) {
  const allocations = token.allocations || [];

  if (allocations.length === 0 && !token.totalSupply) {
    return null;
  }

  const supplyStats: HubMetadataStat[] = [];
  if (token.totalSupply != null) {
    supplyStats.push({
      label: 'Total supply',
      value: formatLargeNumber(token.totalSupply),
      hint: token.symbol,
      accent: true,
      copyable: false,
      tooltipTitle: 'Total supply',
      tooltipDescription: 'Full supply figure for this token listing.',
    });
  }
  if (token.circulatingSupply != null) {
    supplyStats.push({
      label: 'Circulating',
      value: formatLargeNumber(token.circulatingSupply),
      hint: token.symbol,
      accent: true,
      copyable: false,
      tooltipTitle: 'Circulating supply',
      tooltipDescription: 'Tokens currently circulating in the market.',
    });
  }
  if (token.maxSupply != null) {
    supplyStats.push({
      label: 'Max supply',
      value: formatLargeNumber(token.maxSupply),
      hint: token.symbol,
      copyable: false,
      tooltipTitle: 'Max supply',
      tooltipDescription: 'Hard cap on mintable supply when the token is capped.',
    });
  }

  return (
    <section id="tokenomics" className="scroll-mt-28 space-y-6">
      <GameOverviewTitleBlock
        kicker="Economics"
        title="Tokenomics"
        subtitle="Supply figures and how allocation is split across categories."
        as="h3"
        compact
      />

      {supplyStats.length > 0 ? <HubMetadataStatGrid stats={supplyStats} /> : null}

      {allocations.length > 0 ? (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Distribution</h4>
          <div className={metadataStatGridClassForCount(allocations.length)}>
            {allocations.map((allocation, index) => {
              const amount = allocation.amount
                ? `${formatLargeNumber(allocation.amount)} ${token.symbol}`
                : null;
              return (
                <div key={index} className={KX_METADATA_STAT_CARD}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        {allocation.category}
                      </div>
                      {allocation.description ? (
                        <p className="mt-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                          {allocation.description}
                        </p>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-semibold tabular-nums tracking-tight text-[color:var(--hub-accent)]">
                        {allocation.percentage}%
                      </div>
                      {amount ? (
                        <div className="mt-0.5 text-xs font-medium text-zinc-500">{amount}</div>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                    <div
                      className="h-2 rounded-full bg-[color:var(--hub-accent)] transition-all"
                      style={{ width: `${Math.min(100, Math.max(0, allocation.percentage))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}
