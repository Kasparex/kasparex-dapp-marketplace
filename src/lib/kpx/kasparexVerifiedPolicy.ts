import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';

export type KasparexVerPolicyMode = 'inherit' | 'allowlist';

/** Comma- or newline-separated `kaspa:` addresses; empty means Kasparex defers to on-chain `kpx/ver` only. */
export function parseKpxVerifiedKaspaAllowlist(): string[] {
  const raw = process.env.KPX_VERIFIED_KASPA_ALLOWLIST || '';
  const parts = raw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const out: string[] = [];
  for (const p of parts) {
    try {
      out.push(normalizeKaspaAddress(p).toLowerCase());
    } catch {
      // skip invalid entries
    }
  }
  return Array.from(new Set(out));
}

/**
 * Kasparex product badge for "verified" (separate from portable on-chain `verified`).
 * - No allowlist env: `verifiedBadge === onChainVerified` (inherit).
 * - Allowlist set: badge requires on-chain verified AND membership in the list.
 */
export function computeKasparexVerifiedBadge(input: {
  addrKey: string;
  onChainVerified: boolean;
}): { mode: KasparexVerPolicyMode; inAllowlist: boolean; verifiedBadge: boolean } {
  const list = parseKpxVerifiedKaspaAllowlist();
  if (list.length === 0) {
    return { mode: 'inherit', inAllowlist: false, verifiedBadge: input.onChainVerified };
  }
  const inAllowlist = list.includes(input.addrKey.toLowerCase());
  return {
    mode: 'allowlist',
    inAllowlist,
    verifiedBadge: Boolean(input.onChainVerified && inAllowlist),
  };
}
