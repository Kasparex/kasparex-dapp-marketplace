'use client';

import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';
import { currentLedgerSeasonBucket } from './ledger-season';
import type { EarnSource, LedgerSeasonBucket } from './hub-ledger-types';
import { appendHubLedgerEarn } from './hub-ledger';

export function appendHubActivityEarn(args: {
  walletRaw: string | undefined | null;
  source: EarnSource;
  redeemableDelta: number;
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
    const season: LedgerSeasonBucket = args.seasonId ?? currentLedgerSeasonBucket();
    return appendHubLedgerEarn({
      walletL1: wLower,
      seasonId: season,
      source: args.source,
      redeemableDelta: pts,
      idempotencyKey: args.idempotencyKey,
      meta: args.meta,
    });
  } catch {
    return null;
  }
}
