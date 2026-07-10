import { kasToKrexAmount, krexToKasAmount, isBuiltinStoreCurrency } from '@/lib/store/currencies';
import type { PricingSnapshot, TokenPriceRate } from './types';

export function getPriceRate(snapshot: PricingSnapshot | null | undefined, tick: string): TokenPriceRate | null {
  if (!snapshot) return null;
  const key = tick.trim().toUpperCase();
  if (key === 'KAS') return snapshot.rates.KAS ?? null;
  return snapshot.rates[key] ?? null;
}

/** Convert a whole-token amount to KAS equivalent using the snapshot. */
export function toKasEq(
  amount: number,
  currency: string,
  snapshot: PricingSnapshot | null | undefined,
): number | null {
  if (!Number.isFinite(amount)) return null;
  const cur = currency.trim().toUpperCase();
  if (cur === 'KAS') return amount;

  const rate = getPriceRate(snapshot, cur);
  if (rate) return amount * rate.kasPerToken;

  if (cur === 'KREX') return krexToKasAmount(amount);

  return null;
}

/** Convert KAS to whole-token amount for display quotes. */
export function fromKasEq(
  kasAmount: number,
  currency: string,
  snapshot: PricingSnapshot | null | undefined,
): number | null {
  if (!Number.isFinite(kasAmount)) return null;
  const cur = currency.trim().toUpperCase();
  if (cur === 'KAS') return kasAmount;

  const rate = getPriceRate(snapshot, cur);
  if (rate && rate.kasPerToken > 0) return kasAmount / rate.kasPerToken;

  if (cur === 'KREX') return kasToKrexAmount(kasAmount);

  return null;
}

export function formatKasEq(kasEq: number, opts?: { prefix?: string }): string {
  const prefix = opts?.prefix ?? '≈ ';
  const formatted =
    kasEq >= 1
      ? kasEq.toLocaleString(undefined, { maximumFractionDigits: 4 })
      : kasEq.toLocaleString(undefined, { maximumFractionDigits: 8 });
  return `${prefix}${formatted} KAS`;
}

/** Format a whole-token amount for display. */
export function formatTokenAmount(amount: number, currency: string): string {
  const cur = currency.trim().toUpperCase();
  const maxFrac = cur === 'KREX' ? 2 : 8;
  const formatted = amount.toLocaleString(undefined, { maximumFractionDigits: maxFrac });
  if (cur === 'KREX') return `${formatted} KREX`;
  if (cur === 'KAS') return `${formatted} KAS`;
  return `${formatted} $${cur}`;
}

/** Resolve token amount to pay for a KAS-denominated hub price. */
export function resolveTokenAmountFromKas(
  kasAmount: number,
  currency: string,
  snapshot: PricingSnapshot | null | undefined,
): number {
  const converted = fromKasEq(kasAmount, currency, snapshot);
  if (converted != null) return converted;
  const cur = currency.trim().toUpperCase();
  if (cur === 'KAS') return kasAmount;
  if (cur === 'KREX') return kasToKrexAmount(kasAmount);
  return kasAmount;
}

/** Display label for a KAS-denominated hub price in the selected currency. */
export function formatHubPaymentFromKas(
  kasAmount: number,
  currency: string,
  snapshot: PricingSnapshot | null | undefined,
  opts?: { showKasSuffix?: boolean },
): string {
  const cur = currency.trim().toUpperCase();
  const showKasSuffix = opts?.showKasSuffix ?? cur !== 'KAS';
  if (cur === 'KAS') {
    const formatted =
      Number.isInteger(kasAmount) ? `${kasAmount}` : kasAmount.toFixed(2).replace(/\.?0+$/, '');
    return `${formatted} KAS`;
  }
  const tokenAmt = resolveTokenAmountFromKas(kasAmount, cur, snapshot);
  const tokenLabel = formatTokenAmount(tokenAmt, cur);
  if (!showKasSuffix) return tokenLabel;
  const kasLabel =
    Number.isInteger(kasAmount) ? `${kasAmount}` : kasAmount.toFixed(2).replace(/\.?0+$/, '');
  return `${tokenLabel} (= ${kasLabel} KAS)`;
}

export function formatTokenWithKasEq(
  amount: number,
  currency: string,
  snapshot: PricingSnapshot | null | undefined,
): string {
  const cur = currency.trim().toUpperCase();
  const native =
    isBuiltinStoreCurrency(cur) || cur === 'KAS'
      ? `${amount.toLocaleString(undefined, { maximumFractionDigits: cur === 'KREX' ? 2 : 8 })} ${cur}`
      : `${amount.toLocaleString(undefined, { maximumFractionDigits: 8 })} $${cur}`;

  if (cur === 'KAS') return native;

  const kasEq = toKasEq(amount, cur, snapshot);
  if (kasEq == null) return native;

  return `${native} (${formatKasEq(kasEq)})`;
}

export function tickersForCurrencies(currencies: string[]): string[] {
  return Array.from(
    new Set(
      currencies
        .map((c) => c.trim().toUpperCase())
        .filter((c) => c && c !== 'KAS'),
    ),
  );
}

export function mergePricingTickers(...groups: string[][]): string[] {
  return tickersForCurrencies(groups.flat());
}
