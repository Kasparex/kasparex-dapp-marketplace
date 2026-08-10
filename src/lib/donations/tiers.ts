import type { CrowdfundTier } from '@/lib/covenant/crowdfund-types';

export function newCrowdfundTierId(): string {
  return `tier_${Math.random().toString(36).slice(2, 10)}`;
}

export function emptyCrowdfundTier(partial?: Partial<CrowdfundTier>): CrowdfundTier {
  return {
    id: partial?.id ?? newCrowdfundTierId(),
    title: partial?.title ?? '',
    description: partial?.description ?? '',
    minKas: partial?.minKas ?? 10,
    reward: partial?.reward ?? '',
    limitedQty: partial?.limitedQty,
    claimedCount: partial?.claimedCount ?? 0,
  };
}

export function sanitizeCrowdfundTiers(tiers: CrowdfundTier[] | undefined | null): CrowdfundTier[] {
  if (!tiers?.length) return [];
  return tiers
    .map((t) => ({
      id: (t.id || newCrowdfundTierId()).trim(),
      title: (t.title || '').trim(),
      description: (t.description || '').trim(),
      minKas: Math.max(0, Number(t.minKas) || 0),
      reward: (t.reward || '').trim() || undefined,
      limitedQty:
        t.limitedQty != null && Number.isFinite(Number(t.limitedQty)) && Number(t.limitedQty) > 0
          ? Math.floor(Number(t.limitedQty))
          : undefined,
      claimedCount: Math.max(0, Math.floor(Number(t.claimedCount) || 0)),
    }))
    .filter((t) => t.title.length > 0 && t.minKas > 0);
}

export function findCrowdfundTier(
  tiers: CrowdfundTier[] | undefined,
  tierId: string | undefined | null,
): CrowdfundTier | null {
  if (!tierId || !tiers?.length) return null;
  return tiers.find((t) => t.id === tierId) ?? null;
}

/** Validate pledge amount against selected tier (min Kas + optional limited qty). */
export function assertPledgeTierAllowed(args: {
  tiers?: CrowdfundTier[];
  tierId?: string | null;
  pledgeKas: number;
}): CrowdfundTier | null {
  if (!args.tierId) return null;
  const tier = findCrowdfundTier(args.tiers, args.tierId);
  if (!tier) throw new Error('Selected reward tier was not found');
  if (args.pledgeKas + 1e-9 < tier.minKas) {
    throw new Error(`This tier requires at least ${tier.minKas} KAS`);
  }
  if (
    tier.limitedQty != null &&
    tier.limitedQty > 0 &&
    (tier.claimedCount ?? 0) >= tier.limitedQty
  ) {
    throw new Error('This reward tier is sold out');
  }
  return tier;
}

export function sortTiersByMinKas(tiers: CrowdfundTier[]): CrowdfundTier[] {
  return [...tiers].sort((a, b) => a.minKas - b.minKas);
}
