import { MINECORE_KREX_PER_KAS } from '@/lib/game/minecore/config';
import type { TokenPriceRate } from './types';

/**
 * Minecore list-price peg. Hub Pay with / catalog settlement prefers market KREX;
 * use this only when the market rate is unavailable.
 */
export function krexFixedPegRate(asOf: string): TokenPriceRate {
  return {
    tick: 'KREX',
    kind: 'fixed_peg',
    kasPerToken: 1 / MINECORE_KREX_PER_KAS,
    source: 'minecore_peg',
    asOf,
  };
}

export function kasNativeRate(asOf: string): TokenPriceRate {
  return {
    tick: 'KAS',
    kind: 'native',
    kasPerToken: 1,
    source: 'native',
    asOf,
  };
}
