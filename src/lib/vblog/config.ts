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
