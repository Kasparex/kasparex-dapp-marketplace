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
import { getTokenImageUrl } from '@/lib/tokens/metadata';
import { getBaseTokenLogo, getBaseTokenLogoUrl } from '@/lib/tokens/baseLogos';

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

function resolveListingLogoUrl(listing: PublishedTokenListing): string | undefined {
  if (listing.logoCid) {
    return getTokenImageUrl(listing.logoCid) ?? undefined;
  }
  const logo = listing.logoUrl?.trim();
  if (logo) {
    if (logo.startsWith('http://') || logo.startsWith('https://') || logo.startsWith('/')) return logo;
    return getTokenImageUrl(logo) ?? logo;
  }
  const snapImage = listing.onChainSnapshot?.imageUrl?.trim();
  if (snapImage) return snapImage;
  return undefined;
}

function resolveBuiltinLogoUrl(symbol: string): string | undefined {
  const id = symbol.toLowerCase();
  const config = getBaseTokenLogo(id);
  if (config?.logoUrl) return config.logoUrl;
  if (config?.logoCid) return getTokenImageUrl(config.logoCid) ?? undefined;
  const raw = getBaseTokenLogoUrl(id);
  if (!raw) return undefined;
  if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('/')) return raw;
  return getTokenImageUrl(raw) ?? undefined;
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
  imageUrl?: string;
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
    const imageUrl = resolveListingLogoUrl(listing);

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
        imageUrl,
      });
      continue;
    }

    const tick = resolveKrc20Tick(listing);
    if (!tick) continue;
    // Builtins are already in the catalog; never duplicate KREX/KAS as public integrated rows.
    if (tick === 'KAS' || tick === 'KREX') continue;
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
      imageUrl: imageUrl ?? resolveBuiltinLogoUrl(tick),
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
  const imageUrls: Record<string, string> = {
    KAS: resolveBuiltinLogoUrl('KAS') ?? '',
    KREX: resolveBuiltinLogoUrl('KREX') ?? '',
  };
  for (const token of publicTokens) {
    if (!token.imageUrl) continue;
    imageUrls[token.id] = token.imageUrl;
    if (token.tick) imageUrls[token.tick] = token.imageUrl;
    if (token.listingSlug) imageUrls[token.listingSlug] = token.imageUrl;
    if (token.covenantId) imageUrls[token.covenantId] = token.imageUrl;
  }
  // Drop empty placeholders.
  for (const key of Object.keys(imageUrls)) {
    if (!imageUrls[key]) delete imageUrls[key];
  }

  const integrated = publicTokens
    .filter((t) => t.kind === 'krc20' && t.tick && t.tick !== 'KREX' && t.tick !== 'KAS')
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
      imageUrl: t.imageUrl,
    }));

  const base = buildHubCurrencyCatalog({
    amountKas: args.amountKas,
    pricingSnapshot: args.pricingSnapshot,
    krexBalance: args.krexBalance,
    includeKasKrex: args.extra?.includeKasKrex !== false,
    integratedTokens: [...(args.extra?.integratedTokens ?? []), ...integrated],
    kcc20Tokens: [...(args.extra?.kcc20Tokens ?? []), ...kcc20Tokens],
    lockedTicks: args.extra?.lockedTicks,
    imageUrls: { ...imageUrls, ...(args.extra?.imageUrls ?? {}) },
  });

  return base.map((entry) => {
    if (entry.kind !== 'kcc20' || !entry.covenantId) return entry;
    const match = publicTokens.find((t) => t.covenantId === entry.covenantId);
    if (!match?.name) return entry;
    return {
      ...entry,
      detail: `${match.name} · KCC-20 · deployer verified`,
      searchText: `${entry.label} ${match.name} ${entry.covenantId}`,
      imageUrl: entry.imageUrl ?? match.imageUrl,
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
