'use client';

import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';
import { currentSeasonWindowUtc } from '@/lib/leaderboard/seasons';
import type { EarnSource, LedgerSeasonBucket } from './hub-ledger-types';
import { appendHubLedgerEarn } from './hub-ledger';

export function appendHubActivityEarn(args: {
  walletRaw: string | undefined | null;
  source: EarnSource;
  redeemableDelta: number;
  /** Defaults to redeemableDelta when omitted (matches Chronicles leaderboard coupling). */
  leaderboardWeight?: number;
  idempotencyKey: string;
  meta?: Record<string, unknown>;
  seasonId?: LedgerSeasonBucket;
}): ReturnType<typeof appendHubLedgerEarn> {
  const raw = (args.walletRaw ?? '').trim();
  if (!raw) return null;
  try {
    const walletNorm = normalizeKaspaAddress(raw);
    const wLower = walletNorm.toLowerCase();
    const pts = Math.floor(args.redeemableDelta);
    const lb =
      args.leaderboardWeight !== undefined ? Math.floor(args.leaderboardWeight) : pts;
    const season: LedgerSeasonBucket = args.seasonId ?? currentSeasonWindowUtc().id;
    return appendHubLedgerEarn({
      walletL1: wLower,
      seasonId: season,
      source: args.source,
      redeemableDelta: pts,
      leaderboardWeight: lb,
      idempotencyKey: args.idempotencyKey,
      meta: args.meta,
    });
  } catch {
    return null;
  }
}
