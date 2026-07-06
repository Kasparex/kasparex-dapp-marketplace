/**
 * Kasparex covenant dApp templates linkable from token utility modules.
 */

export type CovenantUtilityTemplateId =
  | 'lockbox'
  | 'split'
  | 'milestone'
  | 'crowdfund'
  | 'voucher';

export type CovenantUtilityTemplate = {
  id: CovenantUtilityTemplateId;
  label: string;
  description: string;
  dappSlug: string;
  badge: string;
};

export const COVENANT_UTILITY_TEMPLATES: CovenantUtilityTemplate[] = [
  {
    id: 'lockbox',
    label: 'Lockbox',
    description: 'Timelock or escrow native KAS with covenant rules.',
    dappSlug: 'lockbox',
    badge: 'Escrow',
  },
  {
    id: 'split',
    label: 'Covenant Split',
    description: 'Fan-out payments to multiple recipients in one covenant flow.',
    dappSlug: 'covenant-split',
    badge: 'Split',
  },
  {
    id: 'milestone',
    label: 'Covenant Milestone',
    description: 'Staged releases tied to milestone checkpoints.',
    dappSlug: 'covenant-milestone',
    badge: 'Streaming',
  },
  {
    id: 'crowdfund',
    label: 'Covenant Crowdfund',
    description: 'Goal-based fundraising with on-chain assurance.',
    dappSlug: 'covenant-crowdfund',
    badge: 'Crowdfund',
  },
  {
    id: 'voucher',
    label: 'Covenant Voucher',
    description: 'Hashlock vouchers for access passes and claims.',
    dappSlug: 'covenant-voucher',
    badge: 'Access',
  },
];

export function getCovenantUtilityTemplate(
  id: CovenantUtilityTemplateId,
): CovenantUtilityTemplate | undefined {
  return COVENANT_UTILITY_TEMPLATES.find((t) => t.id === id);
}

export function buildCovenantUtilityHref(
  template: CovenantUtilityTemplate,
  args: { tokenSlug?: string; covenantId?: string },
): string {
  const params = new URLSearchParams();
  if (args.tokenSlug) params.set('token', args.tokenSlug);
  if (args.covenantId) params.set('covenantId', args.covenantId);
  const qs = params.toString();
  return `/dapps/${template.dappSlug}${qs ? `?${qs}` : ''}`;
}
