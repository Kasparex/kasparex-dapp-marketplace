import type { CovenantTemplate } from '@/lib/programmability/types';

const SLUG_TO_COVENANT_TEMPLATE: Record<string, CovenantTemplate> = {
  lockbox: 'lockbox',
  'covenant-split': 'split',
  'covenant-milestone': 'milestone',
  'covenant-crowdfund': 'crowdfund',
  'covenant-voucher': 'voucher',
};

export function covenantTemplateFromDAppSlug(slug?: string): CovenantTemplate | null {
  if (!slug) return null;
  return SLUG_TO_COVENANT_TEMPLATE[slug] ?? null;
}
