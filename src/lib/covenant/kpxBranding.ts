/**
 * KPX covenant product branding: UI names, on-chain tmpl ids, deploy payload meta.
 * Separate from the KPX identity protocol (on-chain pf/cm/lnk/ver records).
 */

import type { CovenantTemplate } from '@/lib/programmability/types';

export const KPX_COVENANT_BRAND_NAME = 'KPX' as const;
export const KPX_COVENANT_META_APP = 'Kasparex Hub' as const;
export const KPX_COVENANT_FAMILY = 'covenant' as const;

export interface KpxCovenantBrand {
  template: CovenantTemplate;
  /** Human title in Hub widgets, e.g. KPX Lockbox */
  displayName: string;
  /** KaspaCom / explorer decoder tmpl id, e.g. KPX_Lockbox_V1 */
  payloadTemplate: string;
  shortLabel: string;
  tagline: string;
  disconnectedMessage: string;
}

const KPX_COVENANT_BRAND_REGISTRY: Record<CovenantTemplate, KpxCovenantBrand> = {
  lockbox: {
    template: 'lockbox',
    displayName: 'KPX Lockbox',
    payloadTemplate: 'KPX_Lockbox_V1',
    shortLabel: 'Lockbox',
    tagline:
      'Lock KAS for someone else with simple rules. Use escrow so they can claim anytime, or timelock so they can only claim after a date you choose.',
    disconnectedMessage: 'Connect your wallet to lock KAS with escrow or timelock rules.',
  },
  split: {
    template: 'split',
    displayName: 'KPX Split',
    payloadTemplate: 'KPX_Split_V1',
    shortLabel: 'Split',
    tagline:
      'Send one KAS payment to several people at once. Set the total, choose each share, and everyone claims their part independently.',
    disconnectedMessage: 'Connect your wallet to split one payment across multiple people.',
  },
  milestone: {
    template: 'milestone',
    displayName: 'KPX Milestone',
    payloadTemplate: 'KPX_Milestone_V1',
    shortLabel: 'Milestone',
    tagline:
      'Pay someone in steps. Lock the full amount up front, then release each part on the dates you set.',
    disconnectedMessage: 'Connect your wallet to create or claim milestone payments.',
  },
  crowdfund: {
    template: 'crowdfund',
    displayName: 'KPX Crowdfund',
    payloadTemplate: 'KPX_Crowdfund_V1',
    shortLabel: 'Crowdfund',
    tagline:
      'Raise KAS for a project with a clear goal and deadline. If you hit the goal, the creator gets the funds. If not, backers can get their money back.',
    disconnectedMessage: 'Connect your wallet to start or back a crowdfund.',
  },
  voucher: {
    template: 'voucher',
    displayName: 'KPX Voucher',
    payloadTemplate: 'KPX_Voucher_V1',
    shortLabel: 'Voucher',
    tagline:
      'Send KAS as a digital gift card. Lock the amount, share a secret code with the recipient, and they can redeem it before it expires.',
    disconnectedMessage: 'Connect your wallet to create or redeem a voucher.',
  },
};

export const KPX_COVENANT_BRANDS = KPX_COVENANT_BRAND_REGISTRY;

export function getKpxCovenantBrand(template: CovenantTemplate): KpxCovenantBrand {
  return KPX_COVENANT_BRAND_REGISTRY[template];
}

/** On-chain tmpl field per Hub covenant template (register with KaspaCom decoders). */
export const KPX_COVENANT_PAYLOAD_TEMPLATES: Record<CovenantTemplate, string> = {
  lockbox: KPX_COVENANT_BRAND_REGISTRY.lockbox.payloadTemplate,
  split: KPX_COVENANT_BRAND_REGISTRY.split.payloadTemplate,
  milestone: KPX_COVENANT_BRAND_REGISTRY.milestone.payloadTemplate,
  crowdfund: KPX_COVENANT_BRAND_REGISTRY.crowdfund.payloadTemplate,
  voucher: KPX_COVENANT_BRAND_REGISTRY.voucher.payloadTemplate,
};

export function kpxCovenantPayloadMeta(extra?: Record<string, string>): Record<string, string> {
  return {
    app: KPX_COVENANT_META_APP,
    brand: KPX_COVENANT_BRAND_NAME,
    family: KPX_COVENANT_FAMILY,
    source: 'kasparex-connect-wallet',
    ...extra,
  };
}
