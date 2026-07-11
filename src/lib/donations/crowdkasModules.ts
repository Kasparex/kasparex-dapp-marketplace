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

export const CROWDKAS_PAYOUT_SPLIT_INCLUDED_RECIPIENTS = 2;
export const CROWDKAS_PAYOUT_SPLIT_EXTRA_FEE_KAS = 5;

export const CROWDKAS_L1_PAYOUT_SPLIT_OFFER = {
  id: 'payoutSplit' as const,
  title: 'Payout split recipients',
  description:
    'Split raised funds across multiple Kaspa addresses when the campaign succeeds. Two recipients included; each additional recipient costs +5 KAS.',
};

export interface CrowdKasModulesConfig {
  countdownHighlight?: boolean;
  donorWall?: boolean;
  shareButtons?: boolean;
  thankYouMessage?: string;
  payoutSplitEnabled?: boolean;
  payoutSplitRecipients?: CrowdKasPayoutSplitRow[];
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
  return Object.keys(out).length > 0 ? out : undefined;
}

export function computeCrowdKasPayoutSplitAddonKas(recipientCount: number): number {
  const extra = Math.max(0, recipientCount - CROWDKAS_PAYOUT_SPLIT_INCLUDED_RECIPIENTS);
  return extra * CROWDKAS_PAYOUT_SPLIT_EXTRA_FEE_KAS;
}

export function defaultCrowdKasPayoutSplitRows(): CrowdKasPayoutSplitRow[] {
  return [
    { address: '', sharePercent: 50 },
    { address: '', sharePercent: 50 },
  ];
}
