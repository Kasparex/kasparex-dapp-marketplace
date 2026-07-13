/**
 * KREX tier helpers for Worker-side Hub Points (shared with frontend tier config).
 */

import type { Env } from '../index';
import { KREX_TIERS as FRONTEND_KREX_TIERS } from '../../src/lib/rewards/types';

export type KREXTier = keyof typeof FRONTEND_KREX_TIERS;

const KREX_MULT_CACHE_TTL_SEC = 60 * 60 * 6;

export function getKREXTierFromBalance(balance: number): KREXTier {
  if (balance >= FRONTEND_KREX_TIERS.Tier4.minKREX) return 'Tier4';
  if (balance >= FRONTEND_KREX_TIERS.Tier3.minKREX) return 'Tier3';
  if (balance >= FRONTEND_KREX_TIERS.Tier2.minKREX) return 'Tier2';
  if (balance >= FRONTEND_KREX_TIERS.Tier1.minKREX) return 'Tier1';
  return 'Tier0';
}

export function getHubPointsMultiplierForTier(tier: KREXTier): number {
  return FRONTEND_KREX_TIERS[tier]?.pointsMultiplier ?? 1;
}

async function queryL1KREXBalance(address: string): Promise<number> {
  try {
    const normalizedAddress = address.replace(/^kaspa:/i, '');
    const apiUrl = `https://indexer.kasplex.org/v1/krc20/address/${encodeURIComponent(normalizedAddress)}/token/KREX`;
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return 0;
    const data = (await response.json()) as { balance?: string | number };
    const balance =
      typeof data.balance === 'string'
        ? parseFloat(data.balance)
        : typeof data.balance === 'number'
          ? data.balance
          : 0;
    return Number.isFinite(balance) ? balance : 0;
  } catch {
    return 0;
  }
}

/** Cached Hub Points multiplier (1x–4x) from operator wallet KREX holdings. */
export async function resolveKrexHubPointsMultiplier(env: Env, wallet: string): Promise<number> {
  const norm = (wallet || '').toLowerCase();
  const key = `krex_mult:${norm}`;
  const raw = await env.KASPAREX_CACHE.get(key);
  if (raw) {
    const cached = Number(raw);
    if (Number.isFinite(cached) && cached > 0) return cached;
  }
  const balance = await queryL1KREXBalance(wallet);
  const tier = getKREXTierFromBalance(balance);
  const mult = getHubPointsMultiplierForTier(tier);
  await env.KASPAREX_CACHE.put(key, String(mult), { expirationTtl: KREX_MULT_CACHE_TTL_SEC });
  return mult;
}
