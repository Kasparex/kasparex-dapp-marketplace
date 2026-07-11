import { resolveKpxCovenantDeployPrice } from '@/lib/covenant/kpxCovenantPricing';
import { getDonationModulePriceKas, DONATION_MODULE_OFFERS, type DonationPaidModuleId } from '@/lib/donations/modules';
import type { KREXTier } from '@/lib/rewards/types';

export const VDONATE_VERIFY_FEE_KAS = 0;

/** L1 covenant campaign edit fee (KAS). Create uses covenant deploy pricing. */
export const VDONATE_L1_EDIT_FEE_KAS = 1;

/** L2 escrow platform fees (iKAS on Igra). */
export const VDONATE_L2_CREATE_FEE_IKAS = 10;
export const VDONATE_L2_EDIT_FEE_IKAS = 1;

/** Delete is free only when the campaign has no donations. */
export const VDONATE_DELETE_FEE = 0;

export type CrowdKasAction = 'verify' | 'create' | 'edit' | 'delete';

export interface CrowdKasModuleAddonLine {
  id: string;
  label: string;
  kas: number;
}

export interface CrowdKasL1PriceQuote {
  action: CrowdKasAction;
  baseFeeKas: number;
  krexDiscountPercent: number;
  modulesFeeKas: number;
  moduleLines: CrowdKasModuleAddonLine[];
  networkFeeBufferKas: number;
  totalKas: number;
}

export interface CrowdKasL2PriceQuote {
  action: CrowdKasAction;
  baseFeeIkas: number;
  totalIkas: number;
}

/** @deprecated Use computeCrowdKasL1PriceQuote or computeCrowdKasL2PriceQuote. */
export interface CrowdKasPriceQuote {
  action: CrowdKasAction;
  baseFeeKas: number;
  modulesFeeKas: number;
  moduleLines: CrowdKasModuleAddonLine[];
  networkFeeBufferKas: number;
  totalKas: number;
}

export function computeCrowdKasL1PriceQuote(opts: {
  action: CrowdKasAction;
  enabledPaidModules?: DonationPaidModuleId[];
  krexBalance?: number;
  krexTier?: KREXTier;
  nft?: { hasAny: boolean; hasDiamond: boolean; hasRarest: boolean };
}): CrowdKasL1PriceQuote {
  const { action, enabledPaidModules = [], krexBalance = 0, krexTier = 'Tier0', nft } = opts;

  let baseFeeKas = 0;
  let krexDiscountPercent = 0;

  if (action === 'create') {
    const deploy = resolveKpxCovenantDeployPrice('crowdfund', krexTier);
    baseFeeKas = deploy.feeKas;
    krexDiscountPercent = deploy.discountPercent;
  } else if (action === 'edit') {
    baseFeeKas = VDONATE_L1_EDIT_FEE_KAS;
  }

  const includeModules = action === 'create' || action === 'edit';
  const moduleLines: CrowdKasModuleAddonLine[] = includeModules
    ? enabledPaidModules.map((id) => {
        const offer = DONATION_MODULE_OFFERS[id];
        const kas = getDonationModulePriceKas(
          offer.basePriceKas,
          krexBalance,
          krexTier,
          nft ?? { hasAny: false, hasDiamond: false, hasRarest: false },
        );
        return { id, label: offer.title, kas };
      })
    : [];

  const modulesFeeKas = moduleLines.reduce((sum, line) => sum + line.kas, 0);
  const networkFeeBufferKas = action === 'create' || action === 'edit' ? 0.001 : 0;
  const totalKas = baseFeeKas + modulesFeeKas + networkFeeBufferKas;

  return {
    action,
    baseFeeKas,
    krexDiscountPercent,
    modulesFeeKas,
    moduleLines,
    networkFeeBufferKas,
    totalKas,
  };
}

export function computeCrowdKasL2PriceQuote(opts: { action: CrowdKasAction }): CrowdKasL2PriceQuote {
  const { action } = opts;
  const baseFeeIkas =
    action === 'create' ? VDONATE_L2_CREATE_FEE_IKAS : action === 'edit' ? VDONATE_L2_EDIT_FEE_IKAS : 0;

  return {
    action,
    baseFeeIkas,
    totalIkas: baseFeeIkas,
  };
}

/** @deprecated Use computeCrowdKasL1PriceQuote. */
export function computeCrowdKasPriceQuote(opts: {
  action: CrowdKasAction;
  enabledPaidModules?: DonationPaidModuleId[];
  krexBalance?: number;
  krexTier?: KREXTier;
  nft?: { hasAny: boolean; hasDiamond: boolean; hasRarest: boolean };
}): CrowdKasPriceQuote {
  const l1 = computeCrowdKasL1PriceQuote(opts);
  return {
    action: l1.action,
    baseFeeKas: l1.baseFeeKas,
    modulesFeeKas: l1.modulesFeeKas,
    moduleLines: l1.moduleLines,
    networkFeeBufferKas: l1.networkFeeBufferKas,
    totalKas: l1.totalKas,
  };
}
