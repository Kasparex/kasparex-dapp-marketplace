/**
 * KPX covenant platform fees (deploy actions). Lock principal is separate.
 */

import type { CovenantTemplate } from '@/lib/programmability/types';
import { krexTierDiscountPercent } from '@/lib/chronicles/vault/pricing';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import { computeEarnedHubPoints } from '@/lib/rewards/hub-points';
import type { KREXTier } from '@/lib/rewards/types';
import { COVENANT_LAB_CONFIG } from './config';
import { KPX_COVENANT_PAYLOAD_TEMPLATES } from './kpxBranding';

export type KpxCovenantFeeAction = 'deploy' | 'claim';

const DEFAULT_DEPLOY_FEE_KAS: Record<CovenantTemplate, number> = {
  lockbox: 10,
  split: 10,
  milestone: 10,
  crowdfund: 10,
  voucher: 10,
};

const ENV_FEE_KEY: Record<CovenantTemplate, string> = {
  lockbox: 'NEXT_PUBLIC_KPX_COVENANT_FEE_LOCKBOX_KAS',
  split: 'NEXT_PUBLIC_KPX_COVENANT_FEE_SPLIT_KAS',
  milestone: 'NEXT_PUBLIC_KPX_COVENANT_FEE_MILESTONE_KAS',
  crowdfund: 'NEXT_PUBLIC_KPX_COVENANT_FEE_CROWDFUND_KAS',
  voucher: 'NEXT_PUBLIC_KPX_COVENANT_FEE_VOUCHER_KAS',
};

export interface KpxCovenantDeployPrice {
  template: CovenantTemplate;
  payloadTemplate: string;
  baseFeeKas: number;
  discountPercent: number;
  feeKas: number;
  feeSompi: string;
  waived: boolean;
  treasuryConfigured: boolean;
  hubPointsBase: number;
  hubPointsEarned: number;
  krexTier: KREXTier;
}

function readBaseDeployFeeKas(template: CovenantTemplate): number {
  const envKey = ENV_FEE_KEY[template];
  const raw =
    (typeof process !== 'undefined' && process.env[envKey]?.trim()) ||
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_KPX_COVENANT_DEPLOY_FEE_KAS?.trim());
  if (raw) {
    const parsed = Number.parseFloat(raw);
    if (Number.isFinite(parsed) && parsed >= 0) return parsed;
  }
  return DEFAULT_DEPLOY_FEE_KAS[template];
}

export function getKpxCovenantTreasuryAddress(): string {
  return COVENANT_LAB_CONFIG.treasuryAddress.trim();
}

export function kasToSompiString(kas: number): string {
  return String(Math.max(0, Math.round(kas * 100_000_000)));
}

export function resolveKpxCovenantDeployPrice(
  template: CovenantTemplate,
  krexTier: KREXTier,
): KpxCovenantDeployPrice {
  const baseFeeKas = readBaseDeployFeeKas(template);
  const discountPercent = krexTierDiscountPercent(krexTier);
  const treasuryConfigured = Boolean(getKpxCovenantTreasuryAddress());
  const discounted =
    Math.round(baseFeeKas * (1 - discountPercent / 100) * 100_000_000) / 100_000_000;
  const feeKas = treasuryConfigured ? Math.max(0.01, discounted) : 0;
  const waived = !treasuryConfigured || feeKas <= 0;
  const hubPointsBase = HUB_EARN_POINTS.kpxCovenantDeploy;
  const hubPointsEarned = computeEarnedHubPoints(hubPointsBase, krexTier);

  return {
    template,
    payloadTemplate: KPX_COVENANT_PAYLOAD_TEMPLATES[template],
    baseFeeKas,
    discountPercent,
    feeKas,
    feeSompi: kasToSompiString(feeKas),
    waived,
    treasuryConfigured,
    hubPointsBase,
    hubPointsEarned,
    krexTier,
  };
}

export function resolveKpxCovenantClaimPoints(krexTier: KREXTier): number {
  return computeEarnedHubPoints(HUB_EARN_POINTS.kpxCovenantClaim, krexTier);
}
