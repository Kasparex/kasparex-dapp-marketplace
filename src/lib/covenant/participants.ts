/**
 * Shared LockBox participant helpers used by runtime, hooks, and UI.
 * Keep claimer rules here so new covenant dApps can reuse the same pattern.
 */

import { normalizeAddr } from './utils';

/** Normalize, dedupe, and require at least one claimer address. */
export function normalizeCovenantClaimers(addresses: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of addresses) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const key = normalizeAddr(trimmed);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  if (out.length === 0) {
    throw new Error('At least one claimer address is required');
  }
  return out;
}

export function isAddressInClaimers(claimers: string[] | undefined, address: string): boolean {
  const want = normalizeAddr(address);
  if (!want) return false;
  for (const c of claimers ?? []) {
    if (normalizeAddr(c) === want) return true;
  }
  return false;
}

/** Depositor or any listed claimer. */
export function isLockboxParticipant(
  vault: { depositor: string; beneficiary: string; beneficiaries?: string[] },
  address: string,
): boolean {
  const want = normalizeAddr(address);
  if (!want) return false;
  if (normalizeAddr(vault.depositor) === want) return true;
  const claimers =
    vault.beneficiaries && vault.beneficiaries.length > 0
      ? vault.beneficiaries
      : [vault.beneficiary];
  return isAddressInClaimers(claimers, address);
}

/** Ensure legacy single-beneficiary rows expose a beneficiaries list. */
export function resolveVaultClaimers(vault: {
  beneficiary: string;
  beneficiaries?: string[];
}): string[] {
  if (vault.beneficiaries && vault.beneficiaries.length > 0) {
    return vault.beneficiaries;
  }
  return vault.beneficiary?.trim() ? [vault.beneficiary.trim()] : [];
}

/** Stable memo for storage + payload (never undefined). */
export function normalizeCovenantMemo(memo: string | null | undefined, maxLen: number): string {
  return String(memo ?? '')
    .trim()
    .slice(0, maxLen);
}
