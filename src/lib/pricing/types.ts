/**
 * Hub pricing snapshot: KAS-equivalent rates for checkout, fees, and Hub Points.
 * No USD layer. KAS is the canonical accounting unit.
 */

export type PriceRateKind = 'native' | 'fixed_peg' | 'market';

export type TokenPriceRate = {
  tick: string;
  kind: PriceRateKind;
  /** KAS per 1 whole token (not smallest units). */
  kasPerToken: number;
  source: string;
  asOf: string;
};

export type PricingSnapshot = {
  asOf: string;
  rates: Record<string, TokenPriceRate>;
};

/** Aggressive client TTL for FX snapshots used by Pay with / Select currency. */
export const PRICING_SNAPSHOT_TTL_MS = 6 * 60 * 60 * 1000;
