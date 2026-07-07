'use client';

import type { DApp } from '@/lib/dapps';
import { getDAppNetworkType } from '@/lib/dapps';
import { isCovenantDAppSlug, getHubPointsBaseForAction } from '@/lib/payments/hubQuote';
import { appendHubActivityEarn } from './appendHubActivityEarn';
import {
  computeHubPointsForAction,
  qualifiesForHubPointsSpend,
} from './hub-points-eligibility';
import type { EarnSource } from './hub-ledger-types';
import type { KREXTier } from './types';

function earnSourceForDApp(dapp: DApp): EarnSource {
  if (isCovenantDAppSlug(dapp.slug)) return 'kpx_covenant_deploy';
  if (getDAppNetworkType(dapp) === 'L1') return 'dapp_l1_interaction';
  return 'dapp_l2_interaction';
}

export type AwardDAppHubPointsResult = {
  earned: number;
  skipped?: 'no_wallet' | 'below_minimum_spend' | 'no_base_points' | 'ledger_write_failed';
};

/** Award redeemable Hub Points for a completed dApp action (no GRID or on-chain token mint). */
export function awardDAppHubPoints(args: {
  walletRaw: string | null | undefined;
  dapp: DApp;
  actionId: string;
  txHash: string;
  krexTier?: KREXTier;
  krexBalance?: number;
  /** Original (pre-discount) KAS-equivalent transaction value for minimum spend rule. */
  baseSpendKas?: number | null;
  /** @deprecated Use baseSpendKas */
  spendKas?: number | null;
}): AwardDAppHubPointsResult {
  const wallet = (args.walletRaw ?? '').trim();
  if (!wallet) return { earned: 0, skipped: 'no_wallet' };

  const tier = args.krexTier ?? 'Tier0';
  const baseRaw = getHubPointsBaseForAction(args.dapp, args.actionId);
  if (baseRaw <= 0) return { earned: 0, skipped: 'no_base_points' };

  const baseSpendKas = args.baseSpendKas ?? args.spendKas;
  if (baseSpendKas != null && !qualifiesForHubPointsSpend(baseSpendKas)) {
    return { earned: 0, skipped: 'below_minimum_spend' };
  }

  const earned = computeHubPointsForAction({
    dapp: args.dapp,
    actionId: args.actionId,
    tier,
  });
  if (earned <= 0) return { earned: 0, skipped: 'no_base_points' };

  const ledgerEntry = appendHubActivityEarn({
    walletRaw: wallet,
    source: earnSourceForDApp(args.dapp),
    redeemableDelta: baseRaw,
    idempotencyKey: `dapp:${args.dapp.id ?? args.dapp.slug}:${args.actionId}:${args.txHash}`,
    krexTier: args.krexTier,
    krexBalance: args.krexBalance,
    meta: {
      dappId: args.dapp.id,
      dappSlug: args.dapp.slug,
      actionId: args.actionId,
      txHash: args.txHash,
      spendKas: baseSpendKas,
      baseSpendKas,
    },
  });

  if (!ledgerEntry) return { earned: 0, skipped: 'ledger_write_failed' };

  return { earned };
}
