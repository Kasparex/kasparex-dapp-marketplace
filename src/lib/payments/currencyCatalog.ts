/**
 * Unified Hub payment currency catalog (KAS / KREX / KRC-20 / KCC-20).
 */

import { kronTokenUrl } from '@/lib/programmable/kron';
import type { PricingSnapshot } from '@/lib/pricing/types';
import { formatHubPaymentFromKas, resolveTokenAmountFromKas } from '@/lib/pricing/registry';
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
  /** Filter chip: settlement network. */
  networkTag?: 'kaspa_l1' | 'l2';
  /** Filter chip: venue / DEX affinity. */
  dexTag?: 'native' | 'kron' | 'kaspacom' | 'zealous' | 'other';
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
  }>;
  /** Tickers still locked (show Unlock via Tokens). */
  lockedTicks?: string[];
  krexBalance?: number;
  includeKasKrex?: boolean;
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
  const entries: HubCurrencyCatalogEntry[] = [];

  if (includeBuiltins) {
    for (const opt of buildKasKrexCurrencyOptions()) {
      let amountLabel: string | undefined;
      let detail: string | undefined;
      if (amountKas != null && amountKas > 0) {
        if (opt.kind === 'kas') {
          amountLabel = formatHubPaymentFromKas(amountKas, 'KAS', args.pricingSnapshot, {
            showKasSuffix: false,
          });
          detail = 'Native Kaspa L1';
        } else {
          amountLabel = formatHubPaymentFromKas(amountKas, 'KREX', args.pricingSnapshot, {
            showKasSuffix: false,
          });
          const krexAmt = resolveTokenAmountFromKas(amountKas, 'KREX', args.pricingSnapshot);
          detail = `≈ ${krexAmt.toLocaleString(undefined, { maximumFractionDigits: 2 })} KREX`;
          if (args.krexBalance != null) {
            detail += ` · balance ${args.krexBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
          }
        }
      } else if (opt.kind === 'kas') {
        detail = 'Native Kaspa L1';
      } else {
        detail = 'KRC-20 · Kasparex utility token';
      }
      entries.push({
        ...opt,
        status: 'available',
        detail,
        amountLabel,
        networkTag: 'kaspa_l1',
        dexTag: 'native',
        balanceLabel:
          opt.kind === 'krex' && args.krexBalance != null
            ? `${args.krexBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })} KREX`
            : undefined,
      });
    }
  }

  for (const token of args.integratedTokens ?? []) {
    const opt = buildKrc20CurrencyOption(token.tick, token.decimals);
    entries.push({
      ...opt,
      status: 'available',
      detail: 'KRC-20 · Kaspa L1',
      networkTag: 'kaspa_l1',
      dexTag: 'native',
      searchText: `${token.symbol ?? ''} ${token.listingSlug ?? ''}`.trim() || undefined,
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
    entries.push({
      ...opt,
      status: 'available',
      detail: 'KCC-20 · Kaspa L1 covenant',
      networkTag: 'kaspa_l1',
      dexTag: 'kron',
      actionHref: kronTokenUrl(token.covenantId),
      actionLabel: 'Trade on KRON',
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
    if (!upper || entries.some((e) => e.id === upper || e.tick === upper)) continue;
    entries.push({
      ...buildKrc20CurrencyOption(upper),
      status: 'locked',
      detail: 'Unlock this ticker in Tokens Hub Utility',
      networkTag: 'kaspa_l1',
      dexTag: 'native',
      actionHref: '/tokens/dashboard',
      actionLabel: 'Open Tokens',
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
    ...option
  } = entry;
  return option;
}
