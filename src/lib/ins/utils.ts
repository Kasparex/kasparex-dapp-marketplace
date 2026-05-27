import { INS_API_BASE } from './config';

const IGRA_SUFFIX = '.igra';
const EXPIRY_WARNING_DAYS = 60;

export function looksLikeInsName(value: string): boolean {
  const v = String(value || '').trim().toLowerCase();
  return v.endsWith(IGRA_SUFFIX);
}

export function normalizeInsName(name: string): string {
  const raw = String(name || '').trim().toLowerCase();
  if (!raw) return raw;
  if (raw.endsWith(IGRA_SUFFIX)) return raw;
  return `${raw}${IGRA_SUFFIX}`;
}

export function stripInsSuffix(name: string): string {
  const raw = String(name || '').trim().toLowerCase();
  if (raw.endsWith(IGRA_SUFFIX)) return raw.slice(0, -IGRA_SUFFIX.length);
  return raw;
}

export function normalizeEvmAddress(address: string): string {
  return String(address || '').trim().toLowerCase();
}

export function isZeroAddress(address: string | null | undefined): boolean {
  const v = normalizeEvmAddress(address || '');
  return v === '0x0000000000000000000000000000000000000000';
}

export function isInsNameExpired(
  expiresAt: string | null | undefined,
  tenure?: string | null,
): boolean {
  if (tenure === 'forever') return false;
  if (!expiresAt) return false;
  const ts = Date.parse(expiresAt);
  if (Number.isNaN(ts)) return false;
  return ts < Date.now();
}

export function isInsNameExpiringSoon(
  expiresAt: string | null | undefined,
  tenure?: string | null,
  withinDays = EXPIRY_WARNING_DAYS,
): boolean {
  if (tenure === 'forever') return false;
  if (!expiresAt) return false;
  const ts = Date.parse(expiresAt);
  if (Number.isNaN(ts)) return false;
  const cutoff = Date.now() + withinDays * 24 * 60 * 60 * 1000;
  return ts <= cutoff && ts >= Date.now();
}

export function getInsNftImageUrl(tokenId: string | number, version?: string | null): string {
  const id = encodeURIComponent(String(tokenId));
  const v = version === 'v1' || version === '1' ? '1' : '2';
  return `${INS_API_BASE}/nft-image/${id}?size=400&v=${v}`;
}

export function looksLikeInsRecipient(value: string): boolean {
  const v = String(value || '').trim().toLowerCase();
  if (!v) return false;
  if (looksLikeInsName(v)) return true;
  // Allow bare labels while typing on Igra (e.g. "alice" before ".igra" is appended)
  if (v.startsWith('0x')) return false;
  return /^[a-z0-9-]+$/.test(v);
}
