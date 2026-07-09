'use client';

import { getAllPublishedListings } from '@/lib/tokens/data';
import { tickersForCurrencies } from './registry';

/** Collect KRC-20 tickers from published listings with utility integrations (client localStorage). */
export function collectIntegratedUtilityTickers(): string[] {
  const listings = getAllPublishedListings();
  const ticks = new Set<string>();

  for (const listing of listings) {
    if (listing.assetKind !== 'real' || listing.listingNetwork !== 'krc20') continue;
    const tick = listing.onChainSnapshot?.ticker?.toUpperCase();
    if (!tick) continue;
    const hasUtility = (listing.paidModuleIds ?? []).includes('utility_integrations');
    const hasProduct = (listing.modulesConfig?.utilityProducts ?? []).length > 0;
    if (hasUtility || hasProduct || listing.listing?.deployerVerified) {
      ticks.add(tick);
    }
  }

  return Array.from(ticks);
}

export function mergePricingTickers(...groups: string[][]): string[] {
  return tickersForCurrencies(groups.flat());
}
