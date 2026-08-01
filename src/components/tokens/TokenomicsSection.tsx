/**
 * Tokenomics Section
 * Supply snapshot + distribution (Games Mining-style stat cards).
 */

'use client';

import type { Token } from '@/lib/tokens/types';
import { formatLargeNumber } from '@/lib/rewards/calculator';
import { GameOverviewTitleBlock } from '@/components/games/panels/GameOverviewSections';
import { TokenStatCard } from '@/components/tokens/TokenStatCard';
import { KX_METADATA_STAT_CARD, KX_METADATA_STAT_GRID, metadataStatItemSpanClass } from '@/lib/hub/shellTokens';

interface TokenomicsSectionProps {
  token: Token;
}

export function TokenomicsSection({ token }: TokenomicsSectionProps) {
  const allocations = token.allocations || [];

  if (allocations.length === 0 && !token.totalSupply) {
    return null;
  }

  return (
    <section id="tokenomics" className="scroll-mt-28 space-y-6">
      <GameOverviewTitleBlock
        kicker="Economics"
        title="Tokenomics"
        subtitle="Supply figures and how allocation is split across categories."
        as="h3"
      />

      {(token.totalSupply || token.circulatingSupply || token.maxSupply) && (
        <div className={KX_METADATA_STAT_GRID}>
          {[
            token.totalSupply != null
              ? {
                  key: 'total',
                  node: (
                    <TokenStatCard
                      label="Total supply"
                      value={formatLargeNumber(token.totalSupply)}
                      hint={token.symbol}
                      tooltipTitle="Total supply"
                      tooltipDescription="Full supply figure for this token listing."
                      valueClassName="text-[color:var(--hub-accent)]"
                    />
                  ),
                }
              : null,
            token.circulatingSupply != null
              ? {
                  key: 'circ',
                  node: (
                    <TokenStatCard
                      label="Circulating"
                      value={formatLargeNumber(token.circulatingSupply)}
                      hint={token.symbol}
                      tooltipTitle="Circulating supply"
                      tooltipDescription="Tokens currently circulating in the market."
                      valueClassName="text-emerald-600 dark:text-emerald-400"
                    />
                  ),
                }
              : null,
            token.maxSupply != null
              ? {
                  key: 'max',
                  node: (
                    <TokenStatCard
                      label="Max supply"
                      value={formatLargeNumber(token.maxSupply)}
                      hint={token.symbol}
                      tooltipTitle="Max supply"
                      tooltipDescription="Hard cap on mintable supply when the token is capped."
                    />
                  ),
                }
              : null,
          ]
            .filter(Boolean)
            .map((item, index, arr) => (
              <div
                key={item!.key}
                className={metadataStatItemSpanClass(index, arr.length) || undefined}
              >
                {item!.node}
              </div>
            ))}
        </div>
      )}

      {allocations.length > 0 ? (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Distribution</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            {allocations.map((allocation, index) => {
              const amount = allocation.amount
                ? `${formatLargeNumber(allocation.amount)} ${token.symbol}`
                : null;

              return (
                <div key={index} className={KX_METADATA_STAT_CARD}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        {allocation.category}
                      </div>
                      {allocation.description ? (
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{allocation.description}</p>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold tabular-nums text-[color:var(--hub-accent)]">
                        {allocation.percentage}%
                      </div>
                      {amount ? <div className="mt-0.5 text-xs text-zinc-500">{amount}</div> : null}
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
