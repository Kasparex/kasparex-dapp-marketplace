/**
 * Shared Hub payment split plan: required KAS (or token) legs + optional change (wallet-owned).
 */

import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';

export type PaymentLegRole =
  | 'treasury'
  | 'rewards'
  | 'creator'
  | 'author'
  | 'platform'
  | 'custom'
  | 'change';

export type PaymentLeg = {
  role: PaymentLegRole;
  address: string;
  /** Amount in KAS (for KAS rail) or token units (for token rails). */
  amount: number;
  label?: string;
  /** When false, verifiers may treat as optional. Default true. */
  required?: boolean;
};

export type PaymentPlan = {
  legs: PaymentLeg[];
  /** Human-readable product context (listing, unlock, game entry, …). */
  note?: string;
  /** Optional hex payload for KAS txs. */
  payloadHex?: string;
};

export const HUB_PAYMENT_MIN_LEG_KAS = 1;

function normAddress(address: string): string {
  const trimmed = address.trim();
  if (!trimmed) throw new Error('Payment leg address is empty');
  try {
    return normalizeKaspaAddress(trimmed);
  } catch {
    return trimmed.startsWith('kaspa:') || trimmed.startsWith('kaspatest:')
      ? trimmed
      : `kaspa:${trimmed}`;
  }
}

export function getHubTreasuryAddress(): string {
  return (
    process.env.NEXT_PUBLIC_STORE_TREASURY_ADDRESS?.trim() ||
    process.env.NEXT_PUBLIC_GAME_TREASURY_ADDRESS?.trim() ||
    ''
  );
}

export function getHubRewardsAddress(): string {
  return process.env.NEXT_PUBLIC_REWARDS_ADDRESS?.trim() || '';
}

/** Rewards share of Hub platform fees when both treasury and rewards are configured (bps). */
export function getHubRewardsFeeBps(): number {
  const raw = process.env.NEXT_PUBLIC_HUB_REWARDS_FEE_BPS?.trim();
  const n = raw ? Number(raw) : 2000;
  if (!Number.isFinite(n) || n < 0) return 2000;
  return Math.min(10_000, Math.floor(n));
}

function roundKas(n: number): number {
  return Math.round(n * 1e8) / 1e8;
}

/**
 * Build a Hub platform fee plan: treasury (+ optional rewards split).
 * Tiny totals stay on a single treasury leg to avoid storage-mass issues.
 */
export function buildHubPlatformFeePlan(args: {
  totalKas: number;
  treasuryAddress?: string;
  rewardsAddress?: string;
  rewardsBps?: number;
  minLegKas?: number;
  note?: string;
  payloadHex?: string;
  extraLegs?: PaymentLeg[];
}): PaymentPlan {
  const minLeg = args.minLegKas ?? HUB_PAYMENT_MIN_LEG_KAS;
  const total = roundKas(Math.max(0, args.totalKas));
  const treasury = (args.treasuryAddress ?? getHubTreasuryAddress()).trim();
  if (!treasury) throw new Error('Treasury address is not configured');

  const rewards = (args.rewardsAddress ?? getHubRewardsAddress()).trim();
  const bps = args.rewardsBps ?? getHubRewardsFeeBps();
  const legs: PaymentLeg[] = [];

  const canSplit =
    Boolean(rewards) &&
    bps > 0 &&
    bps < 10_000 &&
    total >= minLeg * 2;

  if (!canSplit) {
    legs.push({
      role: 'treasury',
      address: normAddress(treasury),
      amount: Math.max(minLeg, total),
      label: 'Kasparex treasury',
      required: true,
    });
  } else {
    let rewardsKas = roundKas((total * bps) / 10_000);
    rewardsKas = Math.max(minLeg, rewardsKas);
    let treasuryKas = roundKas(total - rewardsKas);
    if (treasuryKas < minLeg) {
      treasuryKas = minLeg;
      rewardsKas = roundKas(total - treasuryKas);
    }
    if (rewardsKas < minLeg) {
      legs.push({
        role: 'treasury',
        address: normAddress(treasury),
        amount: Math.max(minLeg, total),
        label: 'Kasparex treasury',
        required: true,
      });
    } else {
      legs.push({
        role: 'treasury',
        address: normAddress(treasury),
        amount: treasuryKas,
        label: 'Kasparex treasury',
        required: true,
      });
      legs.push({
        role: 'rewards',
        address: normAddress(rewards),
        amount: rewardsKas,
        label: 'Rewards pool',
        required: true,
      });
    }
  }

  for (const extra of args.extraLegs ?? []) {
    if (!extra.address?.trim() || !(extra.amount > 0)) continue;
    legs.push({
      ...extra,
      address: normAddress(extra.address),
      amount: roundKas(extra.amount),
      required: extra.required !== false,
    });
  }

  return { legs, note: args.note, payloadHex: args.payloadHex };
}

/** Author / creator share + optional platform fee (vBlog-style). */
export function buildCreatorPlatformPlan(args: {
  creatorAddress: string;
  creatorKas: number;
  platformKas?: number;
  platformAddress?: string;
  creatorLabel?: string;
  note?: string;
  payloadHex?: string;
  extraLegs?: PaymentLeg[];
}): PaymentPlan {
  const minLeg = HUB_PAYMENT_MIN_LEG_KAS;
  const legs: PaymentLeg[] = [
    {
      role: 'creator',
      address: normAddress(args.creatorAddress),
      amount: Math.max(minLeg, roundKas(args.creatorKas)),
      label: args.creatorLabel ?? 'Creator',
      required: true,
    },
  ];

  const platformKas = args.platformKas ?? 0;
  const platformAddress = (args.platformAddress ?? getHubTreasuryAddress()).trim();
  if (platformKas > 1e-9 && platformAddress) {
    legs.push({
      role: 'platform',
      address: normAddress(platformAddress),
      amount: Math.max(minLeg, roundKas(platformKas)),
      label: 'Platform fee',
      required: true,
    });
  }

  for (const extra of args.extraLegs ?? []) {
    if (!extra.address?.trim() || !(extra.amount > 0)) continue;
    legs.push({
      ...extra,
      address: normAddress(extra.address),
      amount: roundKas(extra.amount),
      required: extra.required !== false,
    });
  }

  return { legs, note: args.note, payloadHex: args.payloadHex };
}

export function paymentPlanTotal(plan: PaymentPlan): number {
  return roundKas(plan.legs.reduce((sum, leg) => sum + (leg.amount > 0 ? leg.amount : 0), 0));
}

export function paymentPlanPrimaryAddress(plan: PaymentPlan): string {
  const preferred =
    plan.legs.find((l) => l.role === 'treasury') ??
    plan.legs.find((l) => l.role === 'platform') ??
    plan.legs[0];
  if (!preferred) throw new Error('Payment plan has no legs');
  return preferred.address;
}

export function mergeSameAddressLegs(plan: PaymentPlan): PaymentPlan {
  const map = new Map<string, PaymentLeg>();
  for (const leg of plan.legs) {
    const key = `${leg.role}:${normAddress(leg.address)}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { ...leg, address: normAddress(leg.address) });
    } else {
      existing.amount = roundKas(existing.amount + leg.amount);
    }
  }
  return { ...plan, legs: Array.from(map.values()) };
}
