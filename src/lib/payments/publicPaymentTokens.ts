/**
 * Public payment currencies from deployer-verified Hub Token listings.
 * KRC-20 ticks and KCC-20 covenants both appear once ownership is verified.
 */

import type { PublishedTokenListing } from '@/lib/tokens/listingRecord';
import { getAllPublishedListings } from '@/lib/tokens/data';
import {
  buildHubCurrencyCatalog,
  buildKcc20CurrencyOption,
  type BuildCurrencyCatalogArgs,
  type HubCurrencyCatalogEntry,
} from '@/lib/payments/currencyCatalog';
import { buildKrc20CurrencyOption } from '@/lib/payments/hubPaymentTypes';
import type { PricingSnapshot } from '@/lib/pricing/types';

function isPublicVerifiedListing(listing: PublishedTokenListing): boolean {
  if (listing.assetKind !== 'real') return false;
  if (listing.ownership !== 'deployer_verified') return false;
  const status = listing.status;
  return status === 'verified' || status === 'published';
}

function resolveKcc20CovenantId(listing: PublishedTokenListing): string | null {
  const snap = listing.onChainSnapshot;
  if (snap?.source === 'kcc20' && snap.covenantId && /^[a-f0-9]{64}$/i.test(snap.covenantId)) {
    return snap.covenantId.toLowerCase();
  }
  if (listing.listingNetwork === 'kcc20') {
    const raw = (listing.contractAddress ?? '').replace(/^kaspa:/i, '').trim().toLowerCase();
    if (/^[a-f0-9]{64}$/.test(raw)) return raw;
  }
  const net = listing.networks?.find((n) => n.network === 'kcc20');
  const fromNet = (net?.contractAddress ?? '').replace(/^kaspa:/i, '').trim().toLowerCase();
  if (/^[a-f0-9]{64}$/.test(fromNet)) return fromNet;
  return null;
}

function resolveKrc20Tick(listing: PublishedTokenListing): string | null {
  const fromSnapshot = listing.onChainSnapshot?.ticker?.trim().toUpperCase();
  if (fromSnapshot) return fromSnapshot;
  const symbol = listing.symbol?.trim().toUpperCase();
  if (!symbol) return null;
  if (listing.listingNetwork === 'krc20' || listing.listingNetwork === 'kaspa_l1') return symbol;
  if (listing.networks?.some((n) => n.network === 'krc20')) return symbol;
  return null;
}

export type PublicVerifiedPaymentToken = {
  kind: 'krc20' | 'kcc20';
  id: string;
  label: string;
  tick?: string;
  covenantId?: string;
  decimals: number;
  listingSlug: string;
  name?: string;
};

/** Registry-wide deployer-verified tokens available to any Hub payer. */
export function listPublicVerifiedPaymentTokens(
  listings: PublishedTokenListing[] = getAllPublishedListings(),
): PublicVerifiedPaymentToken[] {
  const out: PublicVerifiedPaymentToken[] = [];
  const seen = new Set<string>();

  for (const listing of listings) {
    if (!isPublicVerifiedListing(listing)) continue;
    const decimals = listing.onChainSnapshot?.decimals ?? listing.decimals ?? 8;

    const covenantId = resolveKcc20CovenantId(listing);
    if (covenantId || listing.listingNetwork === 'kcc20' || listing.onChainSnapshot?.source === 'kcc20') {
      if (!covenantId) continue;
      const id = `kcc20:${covenantId}`;
      if (seen.has(id)) continue;
      seen.add(id);
      const tick = (listing.onChainSnapshot?.ticker || listing.symbol || `KCC${covenantId.slice(0, 6)}`).toUpperCase();
      out.push({
        kind: 'kcc20',
        id,
        label: tick,
        tick,
        covenantId,
        decimals,
        listingSlug: listing.slug,
        name: listing.name,
      });
      continue;
    }

    const tick = resolveKrc20Tick(listing);
    if (!tick) continue;
    if (seen.has(tick)) continue;
    seen.add(tick);
    out.push({
      kind: 'krc20',
      id: tick,
      label: tick,
      tick,
      decimals,
      listingSlug: listing.slug,
      name: listing.name,
    });
  }

  return out;
}

/** Build a Hub currency catalog that includes builtins + public verified tokens. */
export function buildPublicHubCurrencyCatalog(args: {
  amountKas?: number;
  pricingSnapshot?: PricingSnapshot | null;
  krexBalance?: number;
  listings?: PublishedTokenListing[];
  extra?: BuildCurrencyCatalogArgs;
}): HubCurrencyCatalogEntry[] {
  const publicTokens = listPublicVerifiedPaymentTokens(args.listings);
  const integrated = publicTokens
    .filter((t) => t.kind === 'krc20' && t.tick)
    .map((t) => ({
      tick: t.tick!,
      decimals: t.decimals,
      symbol: t.label,
      listingSlug: t.listingSlug,
    }));
  const kcc20Tokens = publicTokens
    .filter((t) => t.kind === 'kcc20' && t.covenantId)
    .map((t) => ({
      id: t.id,
      label: t.label,
      covenantId: t.covenantId!,
      decimals: t.decimals,
      ticker: t.tick,
    }));

  const base = buildHubCurrencyCatalog({
    amountKas: args.amountKas,
    pricingSnapshot: args.pricingSnapshot,
    krexBalance: args.krexBalance,
    includeKasKrex: args.extra?.includeKasKrex !== false,
    integratedTokens: [...(args.extra?.integratedTokens ?? []), ...integrated],
    kcc20Tokens: [...(args.extra?.kcc20Tokens ?? []), ...kcc20Tokens],
    lockedTicks: args.extra?.lockedTicks,
  });

  // Enrich KCC-20 rows with listing name for search.
  return base.map((entry) => {
    if (entry.kind !== 'kcc20' || !entry.covenantId) return entry;
    const match = publicTokens.find((t) => t.covenantId === entry.covenantId);
    if (!match?.name) return entry;
    return {
      ...entry,
      detail: `${match.name} · KCC-20 · deployer verified`,
      searchText: `${entry.label} ${match.name} ${entry.covenantId}`,
    };
  });
}

export function publicTokenToCurrencyOption(token: PublicVerifiedPaymentToken) {
  if (token.kind === 'kcc20' && token.covenantId) {
    return buildKcc20CurrencyOption({
      covenantId: token.covenantId,
      label: token.label,
      ticker: token.tick,
      decimals: token.decimals,
    });
  }
  return buildKrc20CurrencyOption(token.tick ?? token.label, token.decimals);
}
