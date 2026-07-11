import type { DonationPaidModuleId } from '@/lib/donations/modules';

export type CrowdKasPayoutSplitRow = {
  address: string;
  sharePercent: number;
};

export type CrowdKasFreeModuleId = 'countdownHighlight' | 'donorWall' | 'shareButtons';

export const CROWDKAS_FREE_MODULE_OFFERS: Record<
  CrowdKasFreeModuleId,
  { id: CrowdKasFreeModuleId; title: string; description: string }
> = {
  countdownHighlight: {
    id: 'countdownHighlight',
    title: 'Countdown highlight',
    description: 'Show a prominent deadline countdown on your public campaign page.',
  },
  donorWall: {
    id: 'donorWall',
    title: 'Donor wall',
    description: 'Display supporter names from the leaderboard in the story section.',
  },
  shareButtons: {
    id: 'shareButtons',
    title: 'Share buttons',
    description: 'Add quick share links for X, Discord, and copy-link on the campaign page.',
  },
};

export const CROWDKAS_FREE_MODULE_IDS = Object.keys(CROWDKAS_FREE_MODULE_OFFERS) as CrowdKasFreeModuleId[];

export const CROWDKAS_PAYOUT_SPLIT_BASE_FEE_KAS = 10;
export const CROWDKAS_PAYOUT_SPLIT_EXTRA_FEE_KAS = 5;

export const CROWDKAS_L1_PAYOUT_SPLIT_OFFER = {
  id: 'payoutSplit' as const,
  title: 'Payout split recipients',
  description:
    'Split raised funds across multiple Kaspa addresses when the campaign succeeds. Costs 10 KAS to enable; each additional recipient adds +5 KAS.',
};

export interface CrowdKasModulesConfig {
  countdownHighlight?: boolean;
  donorWall?: boolean;
  shareButtons?: boolean;
  thankYouMessage?: string;
  payoutSplitEnabled?: boolean;
  payoutSplitRecipients?: CrowdKasPayoutSplitRow[];
  /** Premium section unlocks (vBlog-style paid content for donors). */
  premiumSectionEnabled?: boolean;
  premiumSectionContent?: string;
  premiumSectionPriceKas?: number;
  premiumSectionPayoutAddress?: string;
  premiumSectionPayoutSplits?: CrowdKasPayoutSplitRow[];
  /** Paid modules selected at create time (unlocked separately on-chain). */
  pendingPaidModules?: DonationPaidModuleId[];
}

export function getEnabledCrowdKasFreeModuleIds(config?: CrowdKasModulesConfig | null): CrowdKasFreeModuleId[] {
  if (!config) return [];
  return CROWDKAS_FREE_MODULE_IDS.filter((id) => Boolean(config[id]));
}

export function cleanCrowdKasModulesConfig(config: CrowdKasModulesConfig): CrowdKasModulesConfig | undefined {
  const out: CrowdKasModulesConfig = {};
  if (config.countdownHighlight) out.countdownHighlight = true;
  if (config.donorWall) out.donorWall = true;
  if (config.shareButtons) out.shareButtons = true;
  const msg = config.thankYouMessage?.trim();
  if (msg) out.thankYouMessage = msg;
  if (config.payoutSplitEnabled) {
    out.payoutSplitEnabled = true;
    const rows = (config.payoutSplitRecipients ?? [])
      .map((r) => ({ address: r.address.trim(), sharePercent: r.sharePercent }))
      .filter((r) => r.address && r.sharePercent > 0);
    if (rows.length) out.payoutSplitRecipients = rows;
  }
  if (config.pendingPaidModules?.length) out.pendingPaidModules = config.pendingPaidModules;
  if (config.premiumSectionEnabled) {
    out.premiumSectionEnabled = true;
    const content = config.premiumSectionContent?.trim();
    if (content) out.premiumSectionContent = content;
    if (config.premiumSectionPriceKas != null && config.premiumSectionPriceKas > 0) {
      out.premiumSectionPriceKas = config.premiumSectionPriceKas;
    }
    const payoutAddr = config.premiumSectionPayoutAddress?.trim();
    if (payoutAddr) out.premiumSectionPayoutAddress = payoutAddr;
    const premiumSplits = (config.premiumSectionPayoutSplits ?? [])
      .map((r) => ({ address: r.address.trim(), sharePercent: r.sharePercent }))
      .filter((r) => r.address && r.sharePercent > 0);
    if (premiumSplits.length) out.premiumSectionPayoutSplits = premiumSplits;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

export function computeCrowdKasPayoutSplitAddonKas(recipientCount: number, enabled = false): number {
  if (!enabled && recipientCount <= 0) return 0;
  const count = Math.max(1, recipientCount);
  return CROWDKAS_PAYOUT_SPLIT_BASE_FEE_KAS + Math.max(0, count - 1) * CROWDKAS_PAYOUT_SPLIT_EXTRA_FEE_KAS;
}

export function defaultCrowdKasPayoutSplitRows(): CrowdKasPayoutSplitRow[] {
  return [
    { address: '', sharePercent: 50 },
    { address: '', sharePercent: 50 },
  ];
}
