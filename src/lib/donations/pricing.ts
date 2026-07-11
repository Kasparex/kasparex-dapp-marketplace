import { resolveKpxCovenantDeployPrice, computeCovenantPremiumSlotAddon } from '@/lib/covenant/kpxCovenantPricing';
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
  payoutSplitAddonKas: number;
  modulesFeeKas: number;
  moduleLines: CrowdKasModuleAddonLine[];
  networkFeeBufferKas: number;
  totalKas: number;
}

export interface CrowdKasL2PriceQuote {
  action: CrowdKasAction;
  /** L2 on-chain platform fee in iKAS (0 when the contract call is nonpayable). */
  baseFeeIkas: number;
  totalIkas: number;
  /** Pending L1 paid module unlocks billed in KAS after save. */
  l1ModuleLines?: CrowdKasModuleAddonLine[];
  l1ModulesFeeKas?: number;
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
  payoutSplitRecipientCount?: number;
  krexBalance?: number;
  krexTier?: KREXTier;
  nft?: { hasAny: boolean; hasDiamond: boolean; hasRarest: boolean };
}): CrowdKasL1PriceQuote {
  const {
    action,
    enabledPaidModules = [],
    payoutSplitRecipientCount = 0,
    krexBalance = 0,
    krexTier = 'Tier0',
    nft,
  } = opts;

  let baseFeeKas = 0;
  let krexDiscountPercent = 0;
  let payoutSplitAddonKas = 0;

  if (action === 'create') {
    const deploy = resolveKpxCovenantDeployPrice('crowdfund', krexTier);
    baseFeeKas = deploy.feeKas;
    krexDiscountPercent = deploy.discountPercent;
    if (payoutSplitRecipientCount > 0) {
      const slotAddon = computeCovenantPremiumSlotAddon('split', payoutSplitRecipientCount);
      payoutSplitAddonKas = slotAddon.addonKas;
    }
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
  const totalKas = baseFeeKas + payoutSplitAddonKas + modulesFeeKas + networkFeeBufferKas;

  return {
    action,
    baseFeeKas,
    krexDiscountPercent,
    payoutSplitAddonKas,
    modulesFeeKas,
    moduleLines,
    networkFeeBufferKas,
    totalKas,
  };
}

export function computeCrowdKasL2PriceQuote(opts: {
  action: CrowdKasAction;
  pendingPaidModules?: DonationPaidModuleId[];
  alreadyUnlocked?: Partial<Record<DonationPaidModuleId, boolean>>;
  krexBalance?: number;
  krexTier?: KREXTier;
  nft?: { hasAny: boolean; hasDiamond: boolean; hasRarest: boolean };
}): CrowdKasL2PriceQuote {
  const {
    action,
    pendingPaidModules = [],
    alreadyUnlocked = {},
    krexBalance = 0,
    krexTier = 'Tier0',
    nft,
  } = opts;

  // L2 escrow create/update contract calls are nonpayable; only network gas is charged in iKAS.
  const baseFeeIkas =
    action === 'create' ? 0 : action === 'edit' ? 0 : 0;

  const l1ModuleLines: CrowdKasModuleAddonLine[] =
    action === 'edit'
      ? pendingPaidModules
          .filter((id) => !alreadyUnlocked[id])
          .map((id) => {
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

  const l1ModulesFeeKas = l1ModuleLines.reduce((sum, line) => sum + line.kas, 0);

  return {
    action,
    baseFeeIkas,
    totalIkas: baseFeeIkas,
    l1ModuleLines: l1ModuleLines.length ? l1ModuleLines : undefined,
    l1ModulesFeeKas: l1ModulesFeeKas > 0 ? l1ModulesFeeKas : undefined,
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
