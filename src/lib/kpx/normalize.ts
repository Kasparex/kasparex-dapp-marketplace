import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';

export function normalizeKpxAddr(addr: string): string {
  return normalizeKaspaAddress(addr).toLowerCase();
}

export function normalizeKpxNet(net: string): string {
  return String(net || '')
    .trim()
    .toLowerCase();
}

export function normalizeDisplayName(input: string): string {
  return String(input || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 24);
}

export function normalizeBio(input: string): string {
  return String(input || '').trim().slice(0, 160);
}

export function normalizeTag(input: string): string {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 16);
}

export function normalizeRid(input: string): string {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '')
    .slice(0, 64);
}

export function normalizeEvmAddress(input: string): string {
  const raw = String(input || '').trim().toLowerCase();
  if (!raw) return raw;
  if (!raw.startsWith('0x')) return `0x${raw.replace(/^0x/i, '')}`;
  return raw;
}

