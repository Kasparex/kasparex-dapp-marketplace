import { getDonationModulePriceKas, DONATION_MODULE_OFFERS, type DonationPaidModuleId } from '@/lib/donations/modules';
import type { KREXTier } from '@/lib/rewards/types';

export const CROWDKAS_VERIFY_FEE_KAS = 0;
export const CROWDKAS_CREATE_FEE_KAS = 0;
export const CROWDKAS_EDIT_FEE_KAS = 0;
export const CROWDKAS_DELETE_FEE_KAS = 0;

export type CrowdKasAction = 'verify' | 'create' | 'edit' | 'delete';

export interface CrowdKasModuleAddonLine {
  id: string;
  label: string;
  kas: number;
}

export interface CrowdKasPriceQuote {
  action: CrowdKasAction;
  baseFeeKas: number;
  modulesFeeKas: number;
  moduleLines: CrowdKasModuleAddonLine[];
  networkFeeBufferKas: number;
  totalKas: number;
}

export function computeCrowdKasPriceQuote(opts: {
  action: CrowdKasAction;
  enabledPaidModules?: DonationPaidModuleId[];
  krexBalance?: number;
  krexTier?: KREXTier;
  nft?: { hasAny: boolean; hasDiamond: boolean; hasRarest: boolean };
}): CrowdKasPriceQuote {
  const { action, enabledPaidModules = [], krexBalance = 0, krexTier = 'Tier0', nft } = opts;
  const baseFeeKas =
    action === 'verify'
      ? CROWDKAS_VERIFY_FEE_KAS
      : action === 'create'
        ? CROWDKAS_CREATE_FEE_KAS
        : action === 'edit'
          ? CROWDKAS_EDIT_FEE_KAS
          : CROWDKAS_DELETE_FEE_KAS;

  const moduleLines: CrowdKasModuleAddonLine[] = enabledPaidModules.map((id) => {
    const offer = DONATION_MODULE_OFFERS[id];
    const kas = getDonationModulePriceKas(offer.basePriceKas, krexBalance, krexTier, nft ?? { hasAny: false, hasDiamond: false, hasRarest: false });
    return { id, label: offer.title, kas };
  });

  const modulesFeeKas = moduleLines.reduce((sum, line) => sum + line.kas, 0);
  const networkFeeBufferKas = action === 'verify' ? 0 : 0.001;
  const totalKas = baseFeeKas + modulesFeeKas + networkFeeBufferKas;

  return {
    action,
    baseFeeKas,
    modulesFeeKas,
    moduleLines,
    networkFeeBufferKas,
    totalKas,
  };
}
