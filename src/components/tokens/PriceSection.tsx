/**
 * Price Section
 * Locked Hub metadata boxes.
 */

'use client';

import type { Token } from '@/lib/tokens/types';
import { GameOverviewTitleBlock } from '@/components/games/panels/GameOverviewSections';
import { HubMetadataStatGrid, type HubMetadataStat } from '@/components/hub/HubMetadataStatGrid';

interface PriceSectionProps {
  token: Token;
}

export function PriceSection({ token }: PriceSectionProps) {
  const price = token.price;
  if (!price) return null;

  const stats: HubMetadataStat[] = [
    {
      label: 'Current price',
      value: `$${price.current.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
      })}`,
      accent: true,
      copyable: false,
    },
  ];

  if (price.change24h !== undefined) {
    stats.push({
      label: '24h change',
      value: `${price.change24h >= 0 ? '+' : ''}${price.change24h.toFixed(2)}%`,
      accent: price.change24h >= 0,
      muted: price.change24h < 0,
      copyable: false,
    });
  }

  if (price.marketCap !== undefined) {
    stats.push({
      label: 'Market cap',
      value: `$${price.marketCap.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      copyable: false,
    });
  }

  if (price.volume24h !== undefined) {
    stats.push({
      label: '24h volume',
      value: `$${price.volume24h.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      copyable: false,
    });
  }

  return (
    <section id="price" className="space-y-6">
      <GameOverviewTitleBlock kicker="Markets" title="Price" as="h3" compact />
      <HubMetadataStatGrid stats={stats} />
      {price.lastUpdated ? (
        <div className="text-xs text-zinc-500 dark:text-zinc-400">
          Last updated: {new Date(price.lastUpdated).toLocaleString()}
        </div>
      ) : null}
    </section>
  );
}
