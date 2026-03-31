import { getAdsTreasuryL1Address } from '@/lib/ads/config';

/**
 * L1 treasury for vBlog article create/edit payments.
 * Falls back to ads treasury if not set.
 */
export function getVBlogTreasuryL1Address(): string {
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_VBLOG_TREASURY_L1_ADDRESS?.trim()) {
    return process.env.NEXT_PUBLIC_VBLOG_TREASURY_L1_ADDRESS.trim();
  }
  return getAdsTreasuryL1Address();
}

export function getVBlogPlatformFeeBps(): number {
  const raw = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_VBLOG_PLATFORM_FEE_BPS : undefined;
  const parsed = Number(raw ?? 500);
  if (!Number.isFinite(parsed) || parsed < 0) return 500;
  return Math.floor(parsed);
}
