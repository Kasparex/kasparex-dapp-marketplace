import type { DonationPaidModuleId } from '@/lib/donations/modules';

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

export interface CrowdKasModulesConfig {
  countdownHighlight?: boolean;
  donorWall?: boolean;
  shareButtons?: boolean;
  thankYouMessage?: string;
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
  if (config.pendingPaidModules?.length) out.pendingPaidModules = config.pendingPaidModules;
  return Object.keys(out).length > 0 ? out : undefined;
}
