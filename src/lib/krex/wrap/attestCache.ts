/**
 * Browser cache for migrate attestations so Confirm → Claim survives remounts
 * even when Hub/GitHub persist lags.
 *
 * Keep this module free of wrap/widget imports so SSR prerender cannot hit
 * circular-export stubs (`loadCachedAttestations is not a function`).
 */

export type CachedMigrateAttestation = {
  burnTxHash?: string;
  ticketId?: string;
  ticketTxId?: string;
  ticketIndex?: number;
  mintTxHash?: string;
  status?: string;
  attestedAt?: string;
  note?: string;
  amountRaw?: string;
  amount?: number;
  tick?: string;
  network?: string;
  from?: string;
  sinkAddress?: string;
  claimantAddress?: string;
  assetCovenantId?: string;
  migrateVersion?: number;
  [key: string]: unknown;
};

const STORAGE_KEY = 'kx_krex_wrap_attest_cache_v1';
const MAX_ROWS = 40;

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function hasTicket(a: CachedMigrateAttestation | null | undefined): boolean {
  if (!a) return false;
  if (a.ticketTxId && String(a.ticketTxId).trim()) return true;
  const id = String(a.ticketId || '')
    .trim()
    .toLowerCase();
  return /^[a-f0-9]{64}:\d+$/.test(id);
}

function readAll(): Record<string, CachedMigrateAttestation> {
  if (!canUseStorage()) return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, CachedMigrateAttestation>;
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed;
  } catch {
    return {};
  }
}

function writeAll(map: Record<string, CachedMigrateAttestation>): void {
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

export function loadCachedAttestations(): Record<string, CachedMigrateAttestation> {
  return readAll();
}

export function cacheAttestation(a: CachedMigrateAttestation): void {
  const key = String(a.burnTxHash || '')
    .trim()
    .toLowerCase();
  if (!key) return;
  const prev = readAll();
  const existing = prev[key];
  if (existing && hasTicket(existing) && !hasTicket(a) && existing.status !== 'claimed') {
    return;
  }
  if (existing?.status === 'claimed' && existing.mintTxHash && a.status !== 'claimed') {
    return;
  }
  prev[key] = a;
  writeAll(prev);
}
