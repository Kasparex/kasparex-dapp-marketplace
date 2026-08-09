/**
 * Browser cache for migrate attestations so Confirm → Claim survives remounts
 * even when Hub/GitHub persist lags.
 */

import { attestationHasTicket, type MigrateAttestation } from './migrateV2';

const STORAGE_KEY = 'kx_krex_wrap_attest_cache_v1';
const MAX_ROWS = 40;

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readAll(): Record<string, MigrateAttestation> {
  if (!canUseStorage()) return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, MigrateAttestation>;
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed;
  } catch {
    return {};
  }
}

function writeAll(map: Record<string, MigrateAttestation>): void {
  if (!canUseStorage()) return;
  try {
    const entries = Object.entries(map)
      .sort((a, b) => String(b[1].attestedAt || '').localeCompare(String(a[1].attestedAt || '')))
      .slice(0, MAX_ROWS);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(entries)));
  } catch {
    /* quota */
  }
}

export function loadCachedAttestations(): Record<string, MigrateAttestation> {
  return readAll();
}

export function cacheAttestation(a: MigrateAttestation): void {
  const key = a.burnTxHash?.toLowerCase();
  if (!key) return;
  const prev = readAll();
  const existing = prev[key];
  if (
    existing &&
    attestationHasTicket(existing) &&
    !attestationHasTicket(a) &&
    existing.status !== 'claimed'
  ) {
    return;
  }
  if (existing?.status === 'claimed' && existing.mintTxHash && a.status !== 'claimed') {
    return;
  }
  prev[key] = a;
  writeAll(prev);
}
