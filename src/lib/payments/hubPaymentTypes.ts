/**
 * Shared Hub payment currency types (KAS, KREX, integrated KRC-20 tickers).
 */

import type { PricingSnapshot } from '@/lib/pricing/types';
import { formatHubPaymentFromKas, formatTokenAmount } from '@/lib/pricing/registry';
import { isBuiltinStoreCurrency, type StorePaymentCurrency } from '@/lib/store/currencies';
import type { IntegratedToken } from '@/lib/tokens/integrationCore';

export type HubPaymentCurrencyKind = 'kas' | 'krex' | 'krc20';

export type HubPaymentCurrencyOption = {
  id: string;
  label: string;
  kind: HubPaymentCurrencyKind;
  tick?: string;
  decimals?: number;
};

export function isBuiltinHubCurrency(id: string): id is StorePaymentCurrency {
  return id === 'KAS' || id === 'KREX';
}

export function buildKasKrexCurrencyOptions(): HubPaymentCurrencyOption[] {
  return [
    { id: 'KAS', label: 'KAS', kind: 'kas' },
    { id: 'KREX', label: 'KREX', kind: 'krex' },
  ];
}

export type KasKrexPaymentCurrency = 'KAS' | 'KREX';

export function buildKasKrexMenuOptions(): Array<{ value: KasKrexPaymentCurrency; label: string }> {
  return buildKasKrexCurrencyOptions().map((option) => ({
    value: option.id as KasKrexPaymentCurrency,
    label: option.label,
  }));
}

export function buildKrc20CurrencyOption(tick: string, decimals = 8): HubPaymentCurrencyOption {
  const upper = tick.toUpperCase();
  return {
    id: upper,
    label: upper,
    kind: 'krc20',
    tick: upper,
    decimals,
  };
}

function dedupeIntegratedTokens(
  integratedToken?: IntegratedToken | null,
  integratedTokens?: IntegratedToken[],
): IntegratedToken[] {
  const seen = new Set<string>();
  const out: IntegratedToken[] = [];
  for (const token of [...(integratedTokens ?? []), ...(integratedToken ? [integratedToken] : [])]) {
    if (!token?.tick) continue;
    const tick = token.tick.toUpperCase();
    if (seen.has(tick)) continue;
    seen.add(tick);
    out.push({ ...token, tick });
  }
  return out;
}

/** Seller listing form: KAS default, KREX, then verified integrated tokens. */
export function buildSellerListingCurrencyOptions(
  integratedTokens?: IntegratedToken[],
): HubPaymentCurrencyOption[] {
  const options = [...buildKasKrexCurrencyOptions()];
  for (const token of integratedTokens ?? []) {
    if (!options.some((option) => option.id === token.tick)) {
      options.push(buildKrc20CurrencyOption(token.tick, token.decimals));
    }
  }
  return options;
}

/**
 * Buyer checkout: seller token(s) first, then KAS, then KREX.
 * KAS remains the default selection in UI even when a token is listed first.
 */
export function buildHubCheckoutCurrencyOptions(opts: {
  listedCurrency: string;
  integratedToken?: IntegratedToken | null;
  integratedTokens?: IntegratedToken[];
}): HubPaymentCurrencyOption[] {
  const listed = opts.listedCurrency.trim().toUpperCase();
  const integratedList = dedupeIntegratedTokens(opts.integratedToken, opts.integratedTokens);

  const ordered: HubPaymentCurrencyOption[] = [];
  const pushUnique = (option: HubPaymentCurrencyOption) => {
    if (!ordered.some((o) => o.id === option.id)) ordered.push(option);
  };

  for (const token of integratedList) {
    pushUnique(buildKrc20CurrencyOption(token.tick, token.decimals));
  }

  if (!isBuiltinStoreCurrency(listed)) {
    const listedOpt = buildKrc20CurrencyOption(listed);
    const existingIdx = ordered.findIndex((o) => o.id === listed);
    if (existingIdx >= 0) {
      const [item] = ordered.splice(existingIdx, 1);
      ordered.unshift(item);
    } else {
      ordered.unshift(listedOpt);
    }
  }

  for (const builtin of buildKasKrexCurrencyOptions()) {
    pushUnique(builtin);
  }

  return ordered;
}

/** Tips / premium unlock: integrated token(s) first, then KAS, then KREX. */
export function buildIntegratedPaymentCurrencyIds(
  integratedToken?: IntegratedToken | null,
  integratedTokens?: IntegratedToken[],
): string[] {
  const currencies: string[] = [];
  const integratedList = dedupeIntegratedTokens(integratedToken, integratedTokens);
  for (const token of integratedList) {
    if (!currencies.includes(token.tick)) currencies.push(token.tick);
  }
  if (!currencies.includes('KAS')) currencies.push('KAS');
  if (!currencies.includes('KREX')) currencies.push('KREX');
  return currencies;
}

export function toHubPaymentMenuOptions<T extends string = string>(
  options: HubPaymentCurrencyOption[],
): Array<{ value: T; label: string }> {
  return options.map((option) => ({ value: option.id as T, label: option.label }));
}

export function formatHubPaymentAmount(
  currency: HubPaymentCurrencyOption,
  kasAmount: number,
  opts?: { directAmount?: number; snapshot?: PricingSnapshot | null },
): string {
  if (currency.kind === 'krex') {
    return formatHubPaymentFromKas(kasAmount, 'KREX', opts?.snapshot, { showKasSuffix: false });
  }
  if (currency.kind === 'krc20' && opts?.directAmount != null) {
    return formatTokenAmount(opts.directAmount, currency.tick ?? currency.id);
  }
  return formatHubPaymentFromKas(kasAmount, 'KAS', opts?.snapshot, { showKasSuffix: false });
}

export type HubPaymentQuoteLine = {
  label: string;
  value: string;
  /** Renders a divider above this row (vBlog calculation breakdown style). */
  dividerBefore?: boolean;
};
