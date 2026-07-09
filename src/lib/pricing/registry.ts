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
