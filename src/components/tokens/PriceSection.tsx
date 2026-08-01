/**
 * Price Section
 * Displays token price information (shared Hub metadata boxes).
 */

'use client';

import type { ReactNode } from 'react';
import type { Token } from '@/lib/tokens/types';
import { GameOverviewTitleBlock } from '@/components/games/panels/GameOverviewSections';
import { TokenStatCard } from '@/components/tokens/TokenStatCard';
import { KX_METADATA_STAT_GRID, metadataStatItemSpanClass } from '@/lib/hub/shellTokens';

interface PriceSectionProps {
  token: Token;
}

export function PriceSection({ token }: PriceSectionProps) {
  const price = token.price;

  if (!price) {
    return null;
  }

  const cards: Array<{
    key: string;
    label: string;
    value: ReactNode;
    valueClassName?: string;
  }> = [
    {
      key: 'current',
      label: 'Current price',
      value: `$${price.current.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
      })}`,
      valueClassName: 'text-[color:var(--hub-accent)]',
    },
  ];

  if (price.change24h !== undefined) {
    cards.push({
      key: 'change',
      label: '24h change',
      value: `${price.change24h >= 0 ? '+' : ''}${price.change24h.toFixed(2)}%`,
      valueClassName:
        price.change24h >= 0
          ? 'text-green-600 dark:text-green-400'
          : 'text-red-600 dark:text-red-400',
    });
  }

  if (price.marketCap !== undefined) {
    cards.push({
      key: 'mcap',
      label: 'Market cap',
      value: `$${price.marketCap.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
    });
  }

  if (price.volume24h !== undefined) {
    cards.push({
      key: 'vol',
      label: '24h volume',
      value: `$${price.volume24h.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
    });
  }

  return (
    <section id="price" className="space-y-6">
      <GameOverviewTitleBlock kicker="Markets" title="Price" as="h3" compact />

      <div className={KX_METADATA_STAT_GRID}>
        {cards.map((card, index) => (
          <div key={card.key} className={metadataStatItemSpanClass(index, cards.length) || undefined}>
            <TokenStatCard
              label={card.label}
              value={card.value}
              valueClassName={card.valueClassName}
            />
          </div>
        ))}
      </div>

      {price.lastUpdated ? (
        <div className="text-xs text-zinc-500 dark:text-zinc-400">
          Last updated: {new Date(price.lastUpdated).toLocaleString()}
        </div>
      ) : null}
    </section>
  );
}
