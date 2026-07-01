import { VBlogModuleId, VBlogModulesConfig } from '@/lib/vblog/types';
import type { KREXTier } from '@/lib/rewards/types';
import type { NFTStatus } from '@/lib/rewards/types';
import {
  chroniclesNftTierDiscountPercent,
  krexTierDiscountPercent,
} from '@/lib/chronicles/vault/pricing';
import { VAULT_MAX_COMBINED_DISCOUNT_PERCENT } from '@/lib/chronicles/vault/constants';

export type VBlogModuleOffer = {
  id: VBlogModuleId;
  title: string;
  description: string;
  unlockPriceKas: number;
  featuredImage?: string;
};

export type VBlogAuthorModuleEntitlements = Record<string, VBlogModuleId[]>;

export type VBlogReaderEntitlement = {
  wallet: string;
  articleId: string;
  moduleId: VBlogModuleId | 'premium_unlock' | 'tip_to_reveal_unlock';
  txHashes: string[];
  createdAt: string;
};

export type VBlogPollVote = {
  articleId: string;
  wallet: string;
  optionIndex: number;
  txHash?: string;
  votedAt: string;
};

export type VBlogReadingReceipt = {
  articleId: string;
  wallet: string;
  txHash: string;
  createdAt: string;
};

const STORAGE_KEYS = {
  authorModuleEntitlements: 'vblog_author_module_entitlements',
  readerEntitlements: 'vblog_reader_entitlements',
  pollVotes: 'vblog_poll_votes',
  readingReceipts: 'vblog_reading_receipts',
} as const;

export const VBLOG_MODULE_OFFERS: VBlogModuleOffer[] = [
  {
    id: 'premium_section',
    title: 'Premium Section Unlocks',
    description: 'Add paid premium sections with author payout and platform fee split.',
    unlockPriceKas: 25,
    featuredImage: '',
  },
  {
    id: 'tip_box',
    title: 'Standard Tipping Box',
    description: 'Enable 10 / 50 / 100 KAS tips and custom amount support.',
    unlockPriceKas: 8,
    featuredImage: '',
  },
  {
    id: 'tip_to_reveal',
    title: 'Tip-to-Reveal Bonus',
    description: 'Unlock hidden bonus content after reader reaches a tip threshold.',
    unlockPriceKas: 12,
    featuredImage: '',
  },
  {
    id: 'premium_poll',
    title: 'Premium Polls',
    description: 'Allow paid readers to vote once on upcoming article direction.',
    unlockPriceKas: 10,
    featuredImage: '',
  },
  {
    id: 'reading_receipts_badges',
    title: 'Reading Receipts + Badges',
    description: 'Enable on-chain reading receipt tracking and streak badge levels.',
    unlockPriceKas: 15,
    featuredImage: '',
  },
  {
    id: 'magazine_integration',
    title: 'Magazine Integration',
    description: 'Link articles to Magazine issues and enable contributor syndication paths.',
    unlockPriceKas: 18,
    featuredImage: '',
  },
];

export function getVBlogModuleDiscountPercent(tier: KREXTier): number {
  return krexTierDiscountPercent(tier);
}

export function getVBlogModuleNftDiscountPercent(nft: NFTStatus | null | undefined): number {
  return chroniclesNftTierDiscountPercent(nft);
}

export function getVBlogModuleCombinedDiscountPercent(
  tier: KREXTier,
  nft: NFTStatus | null | undefined,
): number {
  return Math.min(
    VAULT_MAX_COMBINED_DISCOUNT_PERCENT,
    getVBlogModuleDiscountPercent(tier) + getVBlogModuleNftDiscountPercent(nft),
  );
}

export function getVBlogModuleEffectivePriceKas(
  baseKas: number,
  tier: KREXTier,
  nft: NFTStatus | null | undefined,
): number {
  const discount = getVBlogModuleCombinedDiscountPercent(tier, nft);
  const factor = 1 - discount / 100;
  return Math.max(0.01, Math.round(baseKas * factor * 100) / 100);
}

export type VBlogModuleAddonLine = {
  id: VBlogModuleId;
  title: string;
  kas: number;
};

export function getEnabledVBlogModuleIds(
  modules?: VBlogModulesConfig,
  magazineIntegrationEnabled?: boolean,
): VBlogModuleId[] {
  const ids: VBlogModuleId[] = [];
  if (modules?.premiumSectionEnabled) ids.push('premium_section');
  if (modules?.tipBoxEnabled) ids.push('tip_box');
  if (modules?.tipToRevealEnabled) ids.push('tip_to_reveal');
  if (modules?.premiumPollEnabled) ids.push('premium_poll');
  if (modules?.readingReceiptsEnabled) ids.push('reading_receipts_badges');
  if (magazineIntegrationEnabled) ids.push('magazine_integration');
  return ids;
}

export function computeVBlogModuleAddonKas(
  modules: VBlogModulesConfig | undefined,
  magazineIntegrationEnabled: boolean,
  tier: KREXTier,
  nft: NFTStatus | null | undefined,
  excludeModuleIds: VBlogModuleId[] = [],
): { totalKas: number; lines: VBlogModuleAddonLine[] } {
  const exclude = new Set(excludeModuleIds);
  const enabledIds = getEnabledVBlogModuleIds(modules, magazineIntegrationEnabled).filter(
    (id) => !exclude.has(id),
  );
  const lines: VBlogModuleAddonLine[] = enabledIds.map((id) => {
    const offer = VBLOG_MODULE_OFFERS.find((x) => x.id === id);
    const base = offer?.unlockPriceKas ?? 0;
    return {
      id,
      title: offer?.title ?? id,
      kas: getVBlogModuleEffectivePriceKas(base, tier, nft),
    };
  });
  const totalKas = Math.round(lines.reduce((sum, line) => sum + line.kas, 0) * 100) / 100;
  return { totalKas, lines };
}

export function getArticlePaidModuleIds(article: {
  paidModuleIds?: VBlogModuleId[];
  modules?: VBlogModulesConfig;
  linkedMagazineId?: string;
  linkedIssueNumber?: number;
}): VBlogModuleId[] {
  if (article.paidModuleIds?.length) return article.paidModuleIds;
  return getEnabledVBlogModuleIds(
    article.modules,
    Boolean(article.linkedMagazineId && article.linkedIssueNumber),
  );
}

export function activateAuthorModules(wallet: string, moduleIds: VBlogModuleId[]): VBlogModuleId[] {
  let unlocked = getAuthorUnlockedModules(wallet);
  for (const id of moduleIds) {
    unlocked = unlockAuthorModule(wallet, id);
  }
  return unlocked;
}

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function safeWrite(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function getAuthorUnlockedModules(wallet: string): VBlogModuleId[] {
  if (!wallet || typeof window === 'undefined') return [];
  const store = safeParse<VBlogAuthorModuleEntitlements>(
    localStorage.getItem(STORAGE_KEYS.authorModuleEntitlements),
    {},
  );
  return store[wallet.toLowerCase()] ?? [];
}

export function unlockAuthorModule(wallet: string, moduleId: VBlogModuleId): VBlogModuleId[] {
  const key = wallet.toLowerCase();
  const store = safeParse<VBlogAuthorModuleEntitlements>(
    localStorage.getItem(STORAGE_KEYS.authorModuleEntitlements),
    {},
  );
  const current = new Set(store[key] ?? []);
  current.add(moduleId);
  store[key] = Array.from(current);
  safeWrite(STORAGE_KEYS.authorModuleEntitlements, store);
  return store[key];
}

export function saveReaderEntitlement(entry: VBlogReaderEntitlement): void {
  if (typeof window === 'undefined') return;
  const items = safeParse<VBlogReaderEntitlement[]>(localStorage.getItem(STORAGE_KEYS.readerEntitlements), []);
  items.push(entry);
  safeWrite(STORAGE_KEYS.readerEntitlements, items);
}

export function hasReaderEntitlement(wallet: string, articleId: string, moduleId: VBlogReaderEntitlement['moduleId']): boolean {
  if (!wallet || typeof window === 'undefined') return false;
  const key = wallet.toLowerCase();
  const items = safeParse<VBlogReaderEntitlement[]>(localStorage.getItem(STORAGE_KEYS.readerEntitlements), []);
  return items.some((x) => x.wallet.toLowerCase() === key && x.articleId === articleId && x.moduleId === moduleId);
}

export function savePollVote(vote: VBlogPollVote): void {
  if (typeof window === 'undefined') return;
  const votes = safeParse<VBlogPollVote[]>(localStorage.getItem(STORAGE_KEYS.pollVotes), []);
  const key = vote.wallet.toLowerCase();
  const already = votes.some((x) => x.articleId === vote.articleId && x.wallet.toLowerCase() === key);
  if (already) return;
  votes.push(vote);
  safeWrite(STORAGE_KEYS.pollVotes, votes);
}

export function getPollVotes(articleId: string): VBlogPollVote[] {
  if (typeof window === 'undefined') return [];
  const votes = safeParse<VBlogPollVote[]>(localStorage.getItem(STORAGE_KEYS.pollVotes), []);
  return votes.filter((x) => x.articleId === articleId);
}

export function hasPollVote(articleId: string, wallet: string): boolean {
  if (!wallet || typeof window === 'undefined') return false;
  const votes = safeParse<VBlogPollVote[]>(localStorage.getItem(STORAGE_KEYS.pollVotes), []);
  return votes.some((x) => x.articleId === articleId && x.wallet.toLowerCase() === wallet.toLowerCase());
}

export function getPollVoteForWallet(articleId: string, wallet: string): VBlogPollVote | undefined {
  if (!wallet || typeof window === 'undefined') return undefined;
  const votes = safeParse<VBlogPollVote[]>(localStorage.getItem(STORAGE_KEYS.pollVotes), []);
  return votes.find((x) => x.articleId === articleId && x.wallet.toLowerCase() === wallet.toLowerCase());
}

export function saveReadingReceipt(receipt: VBlogReadingReceipt): void {
  if (typeof window === 'undefined') return;
  const all = safeParse<VBlogReadingReceipt[]>(localStorage.getItem(STORAGE_KEYS.readingReceipts), []);
  const exists = all.some(
    (x) => x.articleId === receipt.articleId && x.wallet.toLowerCase() === receipt.wallet.toLowerCase(),
  );
  if (!exists) {
    all.push(receipt);
    safeWrite(STORAGE_KEYS.readingReceipts, all);
  }
}

export function getReadingReceipts(wallet: string): VBlogReadingReceipt[] {
  if (!wallet || typeof window === 'undefined') return [];
  const all = safeParse<VBlogReadingReceipt[]>(localStorage.getItem(STORAGE_KEYS.readingReceipts), []);
  return all
    .filter((x) => x.wallet.toLowerCase() === wallet.toLowerCase())
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function getReceiptStreakAndBadge(wallet: string): { streak: number; badge: string } {
  const receipts = getReadingReceipts(wallet);
  if (receipts.length === 0) return { streak: 0, badge: 'No badge' };
  const dayKeys = Array.from(
    new Set(
      receipts.map((x) => {
        const d = new Date(x.createdAt);
        return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
      }),
    ),
  );
  let streak = 1;
  for (let i = 1; i < dayKeys.length; i++) {
    const prev = new Date(dayKeys[i - 1]);
    const cur = new Date(dayKeys[i]);
    const diffDays = Math.round((prev.getTime() - cur.getTime()) / (24 * 60 * 60 * 1000));
    if (diffDays === 1) streak += 1;
    else break;
  }
  const badge = streak >= 30 ? 'Mythic Reader' : streak >= 14 ? 'Elite Reader' : streak >= 7 ? 'Pro Reader' : streak >= 3 ? 'Active Reader' : 'Starter Reader';
  return { streak, badge };
}
