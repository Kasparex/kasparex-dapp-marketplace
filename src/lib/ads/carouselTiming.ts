import type { AdEntry } from './types';
import { ADS_EXTENDED_EXPOSURE_SECONDS } from './constants';

/** Default slide duration before advancing to the next ad in a rotation slot. */
export const ADS_BASE_CAROUSEL_INTERVAL_MS = 4000;

export function exposureBonusSecondsForAd(ad: Pick<AdEntry, 'exposureBonusSeconds'>): number {
  return ad.exposureBonusSeconds ?? 0;
}

export function getAdSlideIntervalMs(ad: Pick<AdEntry, 'exposureBonusSeconds'>): number {
  return ADS_BASE_CAROUSEL_INTERVAL_MS + exposureBonusSecondsForAd(ad) * 1000;
}

export function exposureBonusSecondsFromPremium(extendedExposure?: boolean): number | undefined {
  return extendedExposure === true ? ADS_EXTENDED_EXPOSURE_SECONDS : undefined;
}
