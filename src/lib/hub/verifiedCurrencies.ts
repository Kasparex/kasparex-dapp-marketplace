import { isBuiltinStoreCurrency } from '@/lib/store/currencies';

/** Real Hub payment currencies (excludes in-game or fictional units like DIAMONDS). */
export const CORE_VERIFIED_HUB_CRYPTO = ['KAS', 'KREX', 'GRID', 'iKAS'] as const;

const CORE_VERIFIED_SET = new Set<string>(CORE_VERIFIED_HUB_CRYPTO);

export function isVerifiedHubCrypto(value: string): boolean {
  const normalized = value.trim().toUpperCase();
  if (!normalized) return false;
  return CORE_VERIFIED_SET.has(normalized) || isBuiltinStoreCurrency(normalized);
}

export function filterToVerifiedHubCrypto(values: Iterable<string>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    const normalized = raw.trim().toUpperCase();
    if (!isVerifiedHubCrypto(normalized) || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }
  return out.sort((a, b) => a.localeCompare(b));
}
