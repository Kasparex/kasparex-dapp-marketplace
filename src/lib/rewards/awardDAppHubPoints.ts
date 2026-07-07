'use client';

import type { DApp } from '@/lib/dapps';
import { getDAppNetworkType } from '@/lib/dapps';
import { getHubPointsBaseForAction, isCovenantDAppSlug } from '@/lib/payments/hubQuote';
import { appendHubActivityEarn } from './appendHubActivityEarn';
import { computeEarnedHubPoints } from './hub-points';
import type { EarnSource } from './hub-ledger-types';
import type { KREXTier } from './types';

function earnSourceForDApp(dapp: DApp): EarnSource {
  if (isCovenantDAppSlug(dapp.slug)) return 'kpx_covenant_deploy';
  if (getDAppNetworkType(dapp) === 'L1') return 'dapp_l1_interaction';
  return 'dapp_l2_interaction';
}

/** Award redeemable Hub Points for a completed dApp action (no GRID or on-chain token mint). */
export function awardDAppHubPoints(args: {
  walletRaw: string | null | undefined;
  dapp: DApp;
  actionId: string;
  txHash: string;
  krexTier?: KREXTier;
  krexBalance?: number;
}): number {
  const base = getHubPointsBaseForAction(args.dapp, args.actionId);
  if (base <= 0) return 0;

  appendHubActivityEarn({
    walletRaw: args.walletRaw,
    source: earnSourceForDApp(args.dapp),
    redeemableDelta: base,
    idempotencyKey: `dapp:${args.dapp.id ?? args.dapp.slug}:${args.actionId}:${args.txHash}`,
    krexTier: args.krexTier,
    krexBalance: args.krexBalance,
    meta: {
      dappId: args.dapp.id,
      dappSlug: args.dapp.slug,
      actionId: args.actionId,
      txHash: args.txHash,
    },
  });

  try {
    window.dispatchEvent(new Event('kasparex-hub-ledger'));
  } catch {
    /* ignore */
  }

  const tier = args.krexTier ?? 'Tier0';
  return computeEarnedHubPoints(base, tier);
}
