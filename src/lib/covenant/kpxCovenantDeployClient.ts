'use client';

import type { CovenantTemplate } from '@/lib/programmability/types';
import { qualifiesForHubPointsSpend } from '@/lib/rewards/hub-points-eligibility';
import { appendHubActivityEarn } from '@/lib/rewards/appendHubActivityEarn';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import type { KREXTier } from '@/lib/rewards/types';
import type { CovenantWalletContext } from './context';
import { payKpxCovenantDeployFee } from './platform-fee';
import type { KpxCovenantDeployPrice } from './kpxCovenantPricing';
import { resolveKpxCovenantClaimPoints } from './kpxCovenantPricing';

export async function verifyKpxCovenantDeployOnServer(args: {
  template: CovenantTemplate;
  payerAddress: string;
  feeTxHash: string;
  requiredFeeKas: number;
  covenantId?: string;
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

export async function runKpxCovenantDeployWithFee<T extends { id: string; covenantId?: string }>(args: {
  template: CovenantTemplate;
  pricing: KpxCovenantDeployPrice;
  ctx: CovenantWalletContext;
  create: () => Promise<T>;
}): Promise<T> {
  let feeTxHash: string | undefined;
  if (!args.pricing.waived) {
    feeTxHash = await payKpxCovenantDeployFee({ ctx: args.ctx, pricing: args.pricing });
  }

  const created = await args.create();

  const spendKas = args.pricing.waived ? 0 : args.pricing.feeKas;
  const idempotencyKey = feeTxHash
    ? `kpx:deploy:${feeTxHash}`
    : `kpx:deploy:local:${args.template}:${created.id}`;

  if (qualifiesForHubPointsSpend(spendKas)) {
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
    const verified = await verifyKpxCovenantDeployOnServer({
      template: args.template,
      payerAddress: args.ctx.userAddress,
      feeTxHash,
      requiredFeeKas: args.pricing.feeKas,
      covenantId: created.covenantId,
    });
    if (!verified.ok) {
      console.warn('[kpx-covenant] fee verify:', verified.error);
    }
  }

  return created;
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
