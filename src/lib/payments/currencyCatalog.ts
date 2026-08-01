/**
 * Unified Hub payment currency catalog (KAS / KREX / KRC-20 / KCC-20).
 */

import { kronTokenUrl } from '@/lib/programmable/kron';
import type { PricingSnapshot } from '@/lib/pricing/types';
import { formatHubPaymentFromKas } from '@/lib/pricing/registry';
import type { IntegratedToken } from '@/lib/tokens/integrationCore';
import {
  buildKasKrexCurrencyOptions,
  buildKrc20CurrencyOption,
  type HubPaymentCurrencyOption,
} from '@/lib/payments/hubPaymentTypes';

export type CatalogCurrencyStatus = 'available' | 'locked' | 'pay_pending';

export type HubCurrencyCatalogEntry = HubPaymentCurrencyOption & {
  status: CatalogCurrencyStatus;
  /** Short subtitle under the ticker (ratio, network, unlock hint). */
  detail?: string;
  /** Balance hint when known. */
  balanceLabel?: string;
  /** Unlock / trade deep-link when locked or KCC-20 trade-only. */
  actionHref?: string;
  actionLabel?: string;
  /** KAS-equivalent for `amountKas` when priced from Hub quote. */
  amountLabel?: string;
  /** Extra searchable text (name, covenant id, …). */
  searchText?: string;
  /** Filter chip: settlement network / standard. */
  networkTag?: 'native_l1' | 'kcc20_l1' | 'krc20_l1' | 'kasplex_l2' | 'igra_l2';
  /** Filter chip: venue / DEX affinity. */
  dexTag?: 'native' | 'kron' | 'kcom' | 'zealous' | 'other';
  /** Optional logo URL (Tokens listing / base logos). */
  imageUrl?: string;
};

export type BuildCurrencyCatalogArgs = {
  /** Base list amount in KAS for ratio labels. */
  amountKas?: number;
  pricingSnapshot?: PricingSnapshot | null;
  integratedTokens?: IntegratedToken[];
  /** Connected / listed KCC-20 assets (unlocked via Tokens). */
  kcc20Tokens?: Array<{
    id: string;
    label: string;
    covenantId: string;
    decimals?: number;
    ticker?: string;
    imageUrl?: string;
  }>;
  /** Tickers still locked (show Unlock via Tokens). */
  lockedTicks?: string[];
  krexBalance?: number;
  includeKasKrex?: boolean;
  /** Optional logos keyed by catalog id / tick (KAS, KREX, GRID, kcc20:…). */
  imageUrls?: Record<string, string>;
};

export function buildKcc20CurrencyOption(args: {
  covenantId: string;
  label?: string;
  ticker?: string;
  decimals?: number;
}): HubPaymentCurrencyOption {
  const id = `kcc20:${args.covenantId.toLowerCase()}`;
  const tick = (args.ticker || args.label || `KCC${args.covenantId.slice(0, 6)}`).toUpperCase();
  return {
    id,
    label: tick,
    kind: 'kcc20',
    tick,
    decimals: args.decimals ?? 8,
    covenantId: args.covenantId.toLowerCase(),
  };
}

export function buildHubCurrencyCatalog(args: BuildCurrencyCatalogArgs): HubCurrencyCatalogEntry[] {
  const includeBuiltins = args.includeKasKrex !== false;
  const amountKas = args.amountKas;
  const imageUrls = args.imageUrls ?? {};
  const entries: HubCurrencyCatalogEntry[] = [];
  const seenIds = new Set<string>();

  const pushUnique = (entry: HubCurrencyCatalogEntry) => {
    const key = entry.id.toUpperCase();
    if (seenIds.has(key)) return;
    if (entry.tick && seenIds.has(entry.tick.toUpperCase())) return;
    seenIds.add(key);
    if (entry.tick) seenIds.add(entry.tick.toUpperCase());
    entries.push(entry);
  };

  if (includeBuiltins) {
    for (const opt of buildKasKrexCurrencyOptions()) {
      let amountLabel: string | undefined;
      let detail: string | undefined;
      if (opt.kind === 'kas') {
        detail = 'Native Kaspa L1';
        if (amountKas != null && amountKas > 0) {
          amountLabel = formatHubPaymentFromKas(amountKas, 'KAS', args.pricingSnapshot, {
            showKasSuffix: false,
          });
        }
      } else {
        const krexRate = args.pricingSnapshot?.rates?.KREX;
        detail =
          krexRate?.kind === 'market'
            ? `KRC-20 · Market rate (${krexRate.source})`
            : krexRate?.kind === 'fixed_peg'
              ? 'KRC-20 · Minecore peg (market unavailable)'
              : 'KRC-20 · Kasparex utility token';
        if (amountKas != null && amountKas > 0) {
          amountLabel = formatHubPaymentFromKas(amountKas, 'KREX', args.pricingSnapshot, {
            showKasSuffix: false,
          });
        }
      }
      pushUnique({
        ...opt,
        status: 'available',
        detail,
        amountLabel,
        networkTag: opt.kind === 'kas' ? 'native_l1' : 'krc20_l1',
        dexTag: 'native',
        imageUrl: imageUrls[opt.id] ?? imageUrls[opt.id.toLowerCase()],
        balanceLabel:
          opt.kind === 'krex' && args.krexBalance != null
            ? `${args.krexBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })} KREX`
            : undefined,
      });
    }
  }

  for (const token of args.integratedTokens ?? []) {
    const tick = token.tick.toUpperCase();
    if (tick === 'KAS' || tick === 'KREX') continue;
    const opt = buildKrc20CurrencyOption(token.tick, token.decimals);
    pushUnique({
      ...opt,
      status: 'available',
      detail: 'KRC-20 · Kaspa L1',
      networkTag: 'krc20_l1',
      dexTag: 'native',
      searchText: `${token.symbol ?? ''} ${token.listingSlug ?? ''}`.trim() || undefined,
      imageUrl: imageUrls[opt.id] ?? imageUrls[tick] ?? imageUrls[token.listingSlug],
      amountLabel:
        amountKas != null && amountKas > 0
          ? formatHubPaymentFromKas(amountKas, token.tick, args.pricingSnapshot, {
              showKasSuffix: false,
            })
          : undefined,
    });
  }

  for (const token of args.kcc20Tokens ?? []) {
    const opt = buildKcc20CurrencyOption(token);
    pushUnique({
      ...opt,
      status: 'available',
      detail: 'KCC-20 · Kaspa L1 covenant',
      networkTag: 'kcc20_l1',
      dexTag: 'kron',
      actionHref: kronTokenUrl(token.covenantId),
      actionLabel: 'Trade on KRON',
      imageUrl: token.imageUrl ?? imageUrls[opt.id] ?? imageUrls[token.covenantId],
      amountLabel:
        amountKas != null && amountKas > 0
          ? formatHubPaymentFromKas(amountKas, 'KAS', args.pricingSnapshot, {
              showKasSuffix: false,
            }) + ' (KAS eq.)'
          : undefined,
    });
  }

  for (const tick of args.lockedTicks ?? []) {
    const upper = tick.trim().toUpperCase();
    if (!upper || upper === 'KAS' || upper === 'KREX') continue;
    pushUnique({
      ...buildKrc20CurrencyOption(upper),
      status: 'locked',
      detail: 'Unlock this ticker in Tokens Hub Utility',
      networkTag: 'krc20_l1',
      dexTag: 'native',
      actionHref: '/tokens/dashboard',
      actionLabel: 'Open Tokens',
      imageUrl: imageUrls[upper],
    });
  }

  return entries;
}

export function catalogEntryToOption(entry: HubCurrencyCatalogEntry): HubPaymentCurrencyOption {
  const {
    status: _s,
    detail: _d,
    balanceLabel: _b,
    actionHref: _a,
    actionLabel: _l,
    amountLabel: _m,
    searchText: _t,
    networkTag: _n,
    dexTag: _x,
    imageUrl: _i,
    ...option
  } = entry;
  return option;
}

/** Resolve a Pay with selection to a settlement option (falls back to KAS). */
export function resolveCatalogPaymentOption(
  catalog: HubCurrencyCatalogEntry[],
  selectedId?: string | null,
): HubPaymentCurrencyOption {
  const entry =
    catalog.find((e) => e.id === selectedId) ??
    catalog.find((e) => e.id === 'KAS') ??
    catalog.find((e) => e.status === 'available') ??
    catalog[0];
  return entry ? catalogEntryToOption(entry) : buildKasKrexCurrencyOptions()[0];
}
