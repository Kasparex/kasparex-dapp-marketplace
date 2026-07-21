'use client';

import { appendHubActivityEarn } from './appendHubActivityEarn';
import { refreshServerHubBalance } from './serverHubBalanceCoordinator';
import type { EarnSource } from './hub-ledger-types';
import type { KREXTier } from './types';

/**
 * Credit Hub Points for a paid Hub listing: local ledger + worker ingest (so header balance updates).
 */
export function creditHubListingEarn(args: {
  walletRaw: string | undefined | null;
  source: EarnSource;
  redeemableDelta: number;
  idempotencyKey: string;
  txHash: string;
  krexBalance?: number;
  krexTier?: KREXTier;
  meta?: Record<string, unknown>;
}): void {
  appendHubActivityEarn({
    walletRaw: args.walletRaw,
    source: args.source,
    redeemableDelta: args.redeemableDelta,
    krexBalance: args.krexBalance,
    krexTier: args.krexTier,
    idempotencyKey: args.idempotencyKey,
    meta: args.meta,
  });

  const wallet = (args.walletRaw ?? '').trim();
  if (!wallet || !args.txHash.trim()) return;

  void fetch('/api/hub/listing-earn', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      wallet,
      txHash: args.txHash,
      source: args.source,
      meta: args.meta,
    }),
  })
    .then(() => refreshServerHubBalance())
    .catch(() => refreshServerHubBalance());
}
