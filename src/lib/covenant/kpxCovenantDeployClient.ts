'use client';

import type { CovenantTemplate } from '@/lib/programmability/types';
import { qualifiesForHubPointsSpend } from '@/lib/rewards/hub-points-eligibility';
import { appendHubActivityEarn } from '@/lib/rewards/appendHubActivityEarn';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import type { KREXTier } from '@/lib/rewards/types';
import type { CovenantWalletContext } from './context';
import { covenantNetworkIdFromContext } from './context';
import { awaitCovenantSettlement } from './execution/await-settlement';
import { payKpxCovenantPlatformFee } from './platform-fee';
import type { KpxCovenantDeployPrice } from './kpxCovenantPricing';
import { resolveKpxCovenantClaimPoints } from './kpxCovenantPricing';
import { reportHubFlowStep } from '@/lib/hub/hubFlowProgress';

export async function verifyKpxCovenantFeeOnServer(args: {
  template: CovenantTemplate;
  action: 'deploy' | 'claim';
  payerAddress: string;
  feeTxHash: string;
  requiredFeeKas: number;
  covenantId?: string;
  instanceId?: string;
}): Promise<{ ok: boolean; ptsIngest?: string; error?: string }> {
  const res = await fetch('/api/covenant/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    error?: string;
    ptsIngest?: string;
    ptsIngestError?: string;
  };
  if (!res.ok || !data.ok) {
    return { ok: false, error: data.error ?? 'Verification failed' };
  }
  return { ok: true, ptsIngest: data.ptsIngest };
}

/** @deprecated Prefer verifyKpxCovenantFeeOnServer */
export async function verifyKpxCovenantDeployOnServer(args: {
  template: CovenantTemplate;
  payerAddress: string;
  feeTxHash: string;
  requiredFeeKas: number;
  covenantId?: string;
}): Promise<{ ok: boolean; ptsIngest?: string; error?: string }> {
  return verifyKpxCovenantFeeOnServer({ ...args, action: 'deploy' });
}

export async function runKpxCovenantDeployWithFee<T extends { id: string; covenantId?: string }>(args: {
  template: CovenantTemplate;
  pricing: KpxCovenantDeployPrice;
  ctx: CovenantWalletContext;
  create: () => Promise<T>;
}): Promise<T> {
  reportHubFlowStep('create', 'covenantCreate');
  // Create the lock first so a failed WASM build cannot charge the platform fee
  // without producing a vault (seen with networkId vs kaspa: change-address mismatch).
  reportHubFlowStep('sign', 'covenantCreate');
  const created = await args.create();

  let feeTxHash: string | undefined;
  if (!args.pricing.waived) {
    reportHubFlowStep('pay-fee', 'covenantCreate');
    feeTxHash = await payKpxCovenantPlatformFee({ ctx: args.ctx, pricing: args.pricing });
  }

  reportHubFlowStep('complete', 'covenantCreate');

  const spendKas = args.pricing.waived ? 0 : args.pricing.feeKas;
  const idempotencyKey = feeTxHash
    ? `kpx:deploy:${feeTxHash}`
    : `kpx:deploy:local:${args.template}:${created.id}`;

  if (qualifiesForHubPointsSpend(args.pricing.baseFeeKas)) {
    appendHubActivityEarn({
      walletRaw: args.ctx.userAddress,
      source: 'kpx_covenant_deploy',
      redeemableDelta: HUB_EARN_POINTS.kpxCovenantDeploy,
      idempotencyKey,
      krexTier: args.pricing.krexTier,
      meta: {
        template: args.template,
        instanceId: created.id,
        covenantId: created.covenantId,
        feeTxHash,
        feeWaived: args.pricing.waived,
        spendKas,
      },
    });
  }

  if (feeTxHash) {
    const verified = await verifyKpxCovenantFeeOnServer({
      template: args.template,
      action: 'deploy',
      payerAddress: args.ctx.userAddress,
      feeTxHash,
      requiredFeeKas: args.pricing.feeKas,
      covenantId: created.covenantId,
      instanceId: created.id,
    });
    if (!verified.ok) {
      console.warn('[kpx-covenant] deploy fee verify:', verified.error);
    }
  }

  return created;
}

export async function runKpxCovenantClaimWithFee<T extends { id: string; covenantId?: string }>(args: {
  template: CovenantTemplate;
  pricing: KpxCovenantDeployPrice;
  ctx: CovenantWalletContext;
  claim: () => Promise<T>;
  /** Override for multi-claim templates (e.g. split share / milestone step). */
  instanceId?: string;
  /** Skip re-charging when a prior fee-first attempt already paid. */
  existingFeeTxHash?: string;
  /** Called right after Hub fee broadcast so callers can persist for retries. */
  onFeePaid?: (feeTxHash: string) => void | Promise<void>;
}): Promise<T> {
  const instanceId = args.instanceId ?? `pending_${Date.now()}`;
  reportHubFlowStep('verify', 'covenantClaim');

  // Fee first, then unlock. Paying after claim often never prompted (wallet busy /
  // fee UTXOs already spent on network fees) and left successful unlocks without a Hub fee.
  let feeTxHash = args.existingFeeTxHash?.trim() || undefined;
  const feeWasJustPaid = !args.pricing.waived && !feeTxHash;
  if (!args.pricing.waived && !feeTxHash) {
    if (!args.pricing.treasuryConfigured) {
      throw new Error('Hub treasury is not configured; claim fee cannot be collected.');
    }
    reportHubFlowStep('sign', 'covenantClaim');
    feeTxHash = await payKpxCovenantPlatformFee({ ctx: args.ctx, pricing: args.pricing });
    if (!feeTxHash) {
      throw new Error('Hub claim fee payment did not return a transaction id.');
    }
    await args.onFeePaid?.(feeTxHash);
  }

  // Wait for the fee tx to settle before building the claim. Otherwise the claim
  // may spend unconfirmed fee change and the node rejects it as an orphan.
  if (feeTxHash && (feeWasJustPaid || args.existingFeeTxHash)) {
    const networkId = covenantNetworkIdFromContext(args.ctx);
    const settled = await awaitCovenantSettlement(feeTxHash, networkId, {
      maxAttempts: feeWasJustPaid ? 10 : 6,
      delayMs: 2000,
    });
    if (!settled.indexed && feeWasJustPaid) {
      // Soft wait: still proceed after a short buffer so wallets can refresh UTXOs.
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  reportHubFlowStep('claim', 'covenantClaim');
  const claimed = await args.claim();
  reportHubFlowStep('complete', 'covenantClaim');
  const resolvedInstanceId = args.instanceId ?? claimed.id;

  const spendKas = args.pricing.waived ? 0 : args.pricing.feeKas;
  const idempotencyKey = feeTxHash
    ? `kpx:claim:${feeTxHash}`
    : `kpx:claim:local:${args.template}:${resolvedInstanceId}`;

  if (args.pricing.waived || args.pricing.baseFeeKas > 0) {
    appendHubActivityEarn({
      walletRaw: args.ctx.userAddress,
      source: 'kpx_covenant_claim',
      redeemableDelta: HUB_EARN_POINTS.kpxCovenantClaim,
      idempotencyKey,
      krexTier: args.pricing.krexTier,
      meta: {
        template: args.template,
        instanceId: resolvedInstanceId,
        covenantId: claimed.covenantId,
        feeTxHash,
        feeWaived: args.pricing.waived,
        spendKas,
      },
    });
    try {
      window.dispatchEvent(new Event('kasparex-hub-ledger'));
    } catch {
      /* ignore */
    }
  }

  if (feeTxHash) {
    const verified = await verifyKpxCovenantFeeOnServer({
      template: args.template,
      action: 'claim',
      payerAddress: args.ctx.userAddress,
      feeTxHash,
      requiredFeeKas: args.pricing.feeKas,
      covenantId: claimed.covenantId,
      instanceId: resolvedInstanceId,
    });
    if (!verified.ok) {
      console.warn('[kpx-covenant] claim fee verify:', verified.error);
    }
  }

  return claimed;
}

export function awardKpxCovenantClaimPoints(args: {
  walletAddress: string;
  template: CovenantTemplate;
  instanceId: string;
  krexTier: KREXTier;
}): void {
  const pts = resolveKpxCovenantClaimPoints(args.krexTier);
  if (pts <= 0) return;
  appendHubActivityEarn({
    walletRaw: args.walletAddress,
    source: 'kpx_covenant_claim',
    redeemableDelta: HUB_EARN_POINTS.kpxCovenantClaim,
    idempotencyKey: `kpx:claim:${args.template}:${args.instanceId}`,
    krexTier: args.krexTier,
    meta: { template: args.template, instanceId: args.instanceId },
  });
  try {
    window.dispatchEvent(new Event('kasparex-hub-ledger'));
  } catch {
    /* ignore */
  }
}
