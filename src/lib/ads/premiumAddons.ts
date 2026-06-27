import { ADS_EXTENDED_EXPOSURE_KAS, ADS_FEATURED_HIGHLIGHT_KAS } from './constants';

export type AdPremiumOptions = {
  featuredHighlight?: boolean;
  extendedExposure?: boolean;
};

/** Flat premium add-ons (one-time, not multiplied by duration, no tier discount). */
export function adPremiumAddonKas(options: AdPremiumOptions): number {
  let total = 0;
  if (options.featuredHighlight === true) total += ADS_FEATURED_HIGHLIGHT_KAS;
  if (options.extendedExposure === true) total += ADS_EXTENDED_EXPOSURE_KAS;
  return total;
}

export function adPremiumOptionsFromMeta(meta: AdPremiumOptions): AdPremiumOptions {
  return {
    featuredHighlight: meta.featuredHighlight === true,
    extendedExposure: meta.extendedExposure === true,
  };
}
