import { resolvePremiumPayoutSplits, type ResolvedPayoutSplit } from '@/lib/vblog/paymentSplit';
import type { CrowdKasModulesConfig } from '@/lib/donations/crowdkasModules';

export const CROWDKAS_PREMIUM_SECTION_OFFER = {
  title: 'Premium Section Unlocks',
  description:
    'Add paid premium content on your campaign page. Donors unlock it with a Kaspa L1 payment that counts toward your campaign.',
};

export const CROWDKAS_PREMIUM_UNLOCK_STORAGE_KEY = 'crowdkas_premium_unlocks_v1';

export type CrowdKasPremiumUnlockRecord = {
  campaignId: string;
  wallet: string;
  unlockedAt: number;
};

function readUnlocks(): CrowdKasPremiumUnlockRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CROWDKAS_PREMIUM_UNLOCK_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CrowdKasPremiumUnlockRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeUnlocks(rows: CrowdKasPremiumUnlockRecord[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CROWDKAS_PREMIUM_UNLOCK_STORAGE_KEY, JSON.stringify(rows));
}

export function hasCrowdKasPremiumUnlock(campaignId: string, wallet: string): boolean {
  const norm = wallet.trim().toLowerCase();
  if (!norm) return false;
  return readUnlocks().some((r) => r.campaignId === campaignId && r.wallet.toLowerCase() === norm);
}

export function grantCrowdKasPremiumUnlock(campaignId: string, wallet: string) {
  const norm = wallet.trim().toLowerCase();
  if (!norm) return;
  const rows = readUnlocks().filter((r) => !(r.campaignId === campaignId && r.wallet.toLowerCase() === norm));
  rows.push({ campaignId, wallet: norm, unlockedAt: Date.now() });
  writeUnlocks(rows);
}

export function resolveCrowdKasPremiumPayoutSplits(
  modules: CrowdKasModulesConfig | undefined,
  fallbackAuthor: string,
): ResolvedPayoutSplit[] {
  const splits = modules?.premiumSectionPayoutSplits
    ?.filter((s) => s.address?.trim())
    .map((s) => ({ address: s.address.trim(), sharePercent: s.sharePercent }));
  if (splits?.length) {
    return resolvePremiumPayoutSplits({ premiumSectionPayoutSplits: splits }, fallbackAuthor);
  }
  const primary = modules?.premiumSectionPayoutAddress?.trim();
  if (primary) {
    return resolvePremiumPayoutSplits({ premiumSectionPayoutAddress: primary }, fallbackAuthor);
  }
  return resolvePremiumPayoutSplits({ premiumSectionPayoutSplits: [{ address: fallbackAuthor, sharePercent: 100 }] }, fallbackAuthor);
}

export const CROWDKAS_PREMIUM_UNLOCK_PAYLOAD_PREFIX = 'CROWDKAS_PREMIUM_UNLOCK:';

export function buildCrowdKasPremiumUnlockPlainNote(args: {
  campaignId: string;
  payerAddress: string;
  amountKas: number;
}): string {
  return `${CROWDKAS_PREMIUM_UNLOCK_PAYLOAD_PREFIX}${args.campaignId}:${args.payerAddress}:${args.amountKas}`;
}
