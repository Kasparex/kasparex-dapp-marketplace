'use client';

import type { CovenantTemplate } from '@/lib/programmability/types';
import { qualifiesForHubPointsSpend } from '@/lib/rewards/hub-points-eligibility';
import { appendHubActivityEarn } from '@/lib/rewards/appendHubActivityEarn';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import type { KREXTier } from '@/lib/rewards/types';
import type { CovenantWalletContext } from './context';
import { payKpxCovenantPlatformFee } from './platform-fee';
import type { KpxCovenantDeployPrice } from './kpxCovenantPricing';
import { resolveKpxCovenantClaimPoints } from './kpxCovenantPricing';

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
  // Create the lock first so a failed WASM build cannot charge the platform fee
  // without producing a vault (seen with networkId vs kaspa: change-address mismatch).
  const created = await args.create();

  let feeTxHash: string | undefined;
  if (!args.pricing.waived) {
    feeTxHash = await payKpxCovenantPlatformFee({ ctx: args.ctx, pricing: args.pricing });
  }

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
}): Promise<T> {
  const claimed = await args.claim();
  const instanceId = args.instanceId ?? claimed.id;

  let feeTxHash: string | undefined;
  if (!args.pricing.waived) {
    feeTxHash = await payKpxCovenantPlatformFee({ ctx: args.ctx, pricing: args.pricing });
  }

  const spendKas = args.pricing.waived ? 0 : args.pricing.feeKas;
  const idempotencyKey = feeTxHash
    ? `kpx:claim:${feeTxHash}`
    : `kpx:claim:local:${args.template}:${instanceId}`;

  // Claim points always apply on successful claim (base is lower than deploy).
  // Also require a real fee base when treasury is configured so waived demos stay quiet.
  if (args.pricing.waived || args.pricing.baseFeeKas > 0) {
    appendHubActivityEarn({
      walletRaw: args.ctx.userAddress,
      source: 'kpx_covenant_claim',
      redeemableDelta: HUB_EARN_POINTS.kpxCovenantClaim,
      idempotencyKey,
      krexTier: args.pricing.krexTier,
      meta: {
        template: args.template,
        instanceId,
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
      instanceId,
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
