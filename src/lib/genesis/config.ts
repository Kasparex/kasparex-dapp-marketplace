import { getVBlogTreasuryL1Address } from '@/lib/vblog/config';

/** L1 treasury for Kaspa Capsule message payments (same treasury as vBlog). */
export function getKaspaCapsuleTreasuryL1Address(): string {
  return getVBlogTreasuryL1Address();
}
