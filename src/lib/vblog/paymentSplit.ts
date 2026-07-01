import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';
import type { VBlogModulesConfig, VBlogPayoutSplit } from '@/lib/vblog/types';

const MAX_SPLIT_WALLETS = 3;

export type ResolvedPayoutSplit = { address: string; sharePercent: number };

export function resolvePremiumPayoutSplits(
  modules: VBlogModulesConfig | undefined,
  fallbackAuthor: string,
): ResolvedPayoutSplit[] {
  const fromSplits = (modules?.premiumSectionPayoutSplits ?? [])
    .map((row) => ({
      address: row.address.trim(),
      sharePercent: Number(row.sharePercent),
    }))
    .filter((row) => row.address && Number.isFinite(row.sharePercent) && row.sharePercent > 0);

  if (fromSplits.length > 0) {
    return normalizeSplitRows(fromSplits);
  }

  const legacy = [
    modules?.premiumSectionPayoutAddress?.trim() || fallbackAuthor.trim(),
    ...(modules?.premiumSectionSplitAddresses ?? []).map((a) => a.trim()),
  ].filter(Boolean);

  if (legacy.length === 0) return [];

  const eq = Math.floor(100 / legacy.length);
  const rows = legacy.slice(0, MAX_SPLIT_WALLETS).map((address, index) => ({
    address,
    sharePercent: index === 0 ? 100 - eq * (legacy.length - 1) : eq,
  }));
  return normalizeSplitRows(rows);
}

function normalizeSplitRows(rows: { address: string; sharePercent: number }[]): ResolvedPayoutSplit[] {
  const out: ResolvedPayoutSplit[] = [];
  for (const row of rows) {
    try {
      const address = normalizeKaspaAddress(row.address);
      if (out.some((x) => x.address === address)) continue;
      out.push({ address, sharePercent: row.sharePercent });
    } catch {
      /* skip invalid */
    }
    if (out.length >= MAX_SPLIT_WALLETS) break;
  }
  return out;
}

/** Split author KAS by percentage (cent-rounded, remainder on first wallet). */
export function splitAuthorKasByPercent(
  authorKas: number,
  splits: ResolvedPayoutSplit[],
): { address: string; kas: number }[] {
  if (splits.length === 0) return [];
  const totalPercent = splits.reduce((s, row) => s + row.sharePercent, 0);
  if (totalPercent <= 0) return [];

  const rows = splits.map((row, index) => {
    const share = row.sharePercent / totalPercent;
    const kas =
      index === splits.length - 1
        ? 0
        : Math.max(0.01, Math.floor(authorKas * share * 100) / 100);
    return { address: row.address, kas };
  });

  const allocated = Math.round(rows.slice(0, -1).reduce((s, r) => s + r.kas, 0) * 100) / 100;
  rows[rows.length - 1].kas = Math.max(0.01, Math.round((authorKas - allocated) * 100) / 100);
  return rows;
}

export function cleanPayoutSplitRows(
  rows: { address: string; sharePercent: string }[],
): VBlogPayoutSplit[] {
  return rows
    .map((row) => ({
      address: row.address.trim(),
      sharePercent: Number(row.sharePercent),
    }))
    .filter((row) => row.address && Number.isFinite(row.sharePercent) && row.sharePercent > 0)
    .slice(0, MAX_SPLIT_WALLETS);
}

export function validatePayoutSplitRows(rows: VBlogPayoutSplit[]): string | null {
  if (rows.length === 0) return 'Premium section needs at least one payout wallet.';
  const total = Math.round(rows.reduce((s, r) => s + r.sharePercent, 0) * 100) / 100;
  if (Math.abs(total - 100) > 0.01) {
    return `Payout split must total 100% (currently ${total}%).`;
  }
  for (const row of rows) {
    try {
      normalizeKaspaAddress(row.address);
    } catch {
      return `Invalid payout wallet: ${row.address}`;
    }
  }
  return null;
}

export const DEFAULT_PAYOUT_SPLIT_ROWS = (): { address: string; sharePercent: string }[] => [
  { address: '', sharePercent: '100' },
  { address: '', sharePercent: '' },
  { address: '', sharePercent: '' },
];

export function payoutSplitRowsFromModules(
  modules?: VBlogModulesConfig,
): { address: string; sharePercent: string }[] {
  const saved = modules?.premiumSectionPayoutSplits;
  if (saved?.length) {
    const rows = saved.map((s) => ({ address: s.address, sharePercent: String(s.sharePercent) }));
    while (rows.length < MAX_SPLIT_WALLETS) rows.push({ address: '', sharePercent: '' });
    return rows.slice(0, MAX_SPLIT_WALLETS);
  }

  const primary = modules?.premiumSectionPayoutAddress ?? '';
  const extras = modules?.premiumSectionSplitAddresses ?? [];
  if (!primary && extras.length === 0) return DEFAULT_PAYOUT_SPLIT_ROWS();

  const all = [primary, ...extras].filter(Boolean).slice(0, MAX_SPLIT_WALLETS);
  const eq = Math.floor(100 / all.length);
  return [
    ...all.map((address, index) => ({
      address,
      sharePercent: String(index === 0 ? 100 - eq * (all.length - 1) : eq),
    })),
    ...Array.from({ length: Math.max(0, MAX_SPLIT_WALLETS - all.length) }, () => ({
      address: '',
      sharePercent: '',
    })),
  ].slice(0, MAX_SPLIT_WALLETS);
}
