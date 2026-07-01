import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';

const MAX_SPLIT_WALLETS = 3;

/** Up to 3 Kaspa payout addresses; first is primary. Covenant routing will use full list later. */
export function resolvePremiumPayoutAddresses(
  primary: string,
  extras?: string[],
): string[] {
  const raw = [primary, ...(extras ?? [])].map((a) => a.trim()).filter(Boolean);
  const out: string[] = [];
  for (const addr of raw) {
    try {
      const norm = normalizeKaspaAddress(addr);
      if (!out.includes(norm)) out.push(norm);
    } catch {
      /* skip invalid */
    }
    if (out.length >= MAX_SPLIT_WALLETS) break;
  }
  return out;
}

/** Equal split of author KAS across wallets (cent-rounded, remainder on first). */
export function splitAuthorKasEvenly(authorKas: number, wallets: string[]): { address: string; kas: number }[] {
  if (wallets.length === 0) return [];
  if (wallets.length === 1) return [{ address: wallets[0], kas: authorKas }];

  const per = Math.floor((authorKas / wallets.length) * 100) / 100;
  const rows = wallets.map((address) => ({ address, kas: Math.max(0.01, per) }));
  const allocated = Math.round(rows.reduce((s, r) => s + r.kas, 0) * 100) / 100;
  const remainder = Math.round((authorKas - allocated) * 100) / 100;
  if (remainder > 0) rows[0].kas = Math.round((rows[0].kas + remainder) * 100) / 100;
  return rows;
}
