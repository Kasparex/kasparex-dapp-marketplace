'use client';

import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';
import { getKREXTierFromBalance } from '@/lib/krex/tier';
import { computeEarnedHubPoints } from './hub-points';
import { currentLedgerSeasonBucket } from './ledger-season';
import type { EarnSource, LedgerSeasonBucket } from './hub-ledger-types';
import type { KREXTier } from './types';
import { appendHubLedgerEarn } from './hub-ledger';

export function appendHubActivityEarn(args: {
  walletRaw: string | undefined | null;
  source: EarnSource;
  /** Base points before KREX tier multiplier. */
  redeemableDelta: number;
  idempotencyKey: string;
  meta?: Record<string, unknown>;
  seasonId?: LedgerSeasonBucket;
  krexTier?: KREXTier;
  krexBalance?: number;
}): ReturnType<typeof appendHubLedgerEarn> {
  const raw = (args.walletRaw ?? '').trim();
  if (!raw) return null;

  const tier =
    args.krexTier ??
    (args.krexBalance != null ? getKREXTierFromBalance(args.krexBalance) : ('Tier0' as KREXTier));
  const pts = computeEarnedHubPoints(args.redeemableDelta, tier);
  if (pts <= 0) return null;

  try {
    const walletNorm = normalizeKaspaAddress(raw);
    const wLower = walletNorm.toLowerCase();
    const season: LedgerSeasonBucket = args.seasonId ?? currentLedgerSeasonBucket();
    return appendHubLedgerEarn({
      walletL1: wLower,
      seasonId: season,
      source: args.source,
      redeemableDelta: pts,
      idempotencyKey: args.idempotencyKey,
      meta: {
        ...args.meta,
        basePoints: args.redeemableDelta,
        krexTier: tier,
        hubPointsMultiplier: pts / args.redeemableDelta,
      },
    });
  } catch {
    return null;
  }
}
