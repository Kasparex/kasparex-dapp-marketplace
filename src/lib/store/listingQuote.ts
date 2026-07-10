import { calculateDirectoryListingFeeKas } from '@/lib/dapps/listingSubmissions';
import type { KREXTier, NFTStatus } from '@/lib/rewards/types';
import { STORE_MODULE_OFFERS, type StoreModuleId } from '@/lib/store/modules';

export const STORE_LISTING_FEE_KAS = 50;
export const STORE_UPDATE_FEE_KAS = 1;
/** @deprecated Use STORE_UPDATE_FEE_KAS */
export const SELLER_ACTION_FEE_KAS = STORE_UPDATE_FEE_KAS;

export type StoreListingModuleLine = {
  id: StoreModuleId;
  title: string;
  kas: number;
};

export type StoreListingQuote = {
  baseFeeKas: number;
  moduleLines: StoreListingModuleLine[];
  modulesFeeKas: number;
  subtotalKas: number;
  discountKas: number;
  discountPercent: number;
  totalKas: number;
};

export function estimateStoreListingQuote(args: {
  baseFeeKas: number;
  enabledModules: Record<StoreModuleId, boolean>;
  krexTier: KREXTier;
  nftStatus: NFTStatus | null | undefined;
}): StoreListingQuote {
  const moduleLines: StoreListingModuleLine[] = STORE_MODULE_OFFERS.filter(
    (offer) => args.enabledModules[offer.id] && offer.unlockPriceKas > 0,
  ).map((offer) => ({
    id: offer.id,
    title: offer.title,
    kas: offer.unlockPriceKas,
  }));

  const modulesFeeKas = moduleLines.reduce((sum, line) => sum + line.kas, 0);
  const subtotalKas = args.baseFeeKas + modulesFeeKas;
  const fee = calculateDirectoryListingFeeKas(subtotalKas, args.krexTier, args.nftStatus);
  const discountKas = Math.max(0, Math.round((fee.baseKas - fee.effectiveKas) * 100) / 100);

  return {
    baseFeeKas: args.baseFeeKas,
    moduleLines,
    modulesFeeKas,
    subtotalKas,
    discountKas,
    discountPercent: fee.discountPercent,
    totalKas: fee.effectiveKas,
  };
}
