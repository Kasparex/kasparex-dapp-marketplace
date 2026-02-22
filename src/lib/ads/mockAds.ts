import type { AdEntry } from './types';

// End times set in the future so mock ads render. Adjust for testing.
const now = new Date();
const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();
const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
const past = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

export const MOCK_ADS: AdEntry[] = [
  {
    id: 'halo-1',
    slotId: 'HALO_DAPPS_RIGHT',
    imageUrl: 'https://placehold.co/400x400/1e3a5f/fff?text=Ad+1',
    link: 'https://kasparex.com',
    title: 'Kasparex Ecosystem',
    startTime: past,
    endTime: in30Days,
    priorityWeight: 1,
  },
  {
    id: 'halo-2',
    slotId: 'HALO_DAPPS_RIGHT',
    imageUrl: 'https://placehold.co/400x400/0d4f3a/fff?text=Ad+2',
    link: 'https://kasparex.com',
    title: 'Build on Kaspa',
    startTime: past,
    endTime: in14Days,
    priorityWeight: 1,
  },
  {
    id: 'halo-3',
    slotId: 'HALO_DAPPS_RIGHT',
    imageUrl: 'https://placehold.co/400x400/4a1d6b/fff?text=Ad+3',
    link: 'https://kasparex.com',
    title: 'KREX Rewards',
    startTime: past,
    endTime: in7Days,
    priorityWeight: 1,
  },
  {
    id: 'sidebar-1',
    slotId: 'SIDEBAR_RANDOM',
    imageUrl: 'https://placehold.co/300x200/2d3748/fff?text=Sidebar',
    link: 'https://kasparex.com/ads',
    title: 'Advertise here',
    startTime: past,
    endTime: in30Days,
  },
  {
    id: 'sidebar-2',
    slotId: 'SIDEBAR_RANDOM',
    imageUrl: 'https://placehold.co/300x200/1a365d/fff?text=Slot',
    link: 'https://kasparex.com/ads',
    title: 'Kasparex Ads',
    startTime: past,
    endTime: in14Days,
  },
  {
    id: 'footer-1',
    slotId: 'FOOTER_BLOCK',
    imageUrl: 'https://placehold.co/200x100/234e52/fff?text=Footer',
    link: 'https://kasparex.com/ads',
    title: 'Footer ad',
    startTime: past,
    endTime: in30Days,
  },
  {
    id: 'footer-2',
    slotId: 'FOOTER_BLOCK',
    imageUrl: 'https://placehold.co/200x100/2c5282/fff?text=Ad',
    link: 'https://kasparex.com',
    title: 'Ecosystem',
    startTime: past,
    endTime: in14Days,
  },
];

export function getActiveAdsForSlot(slotId: string): AdEntry[] {
  const nowMs = Date.now();
  return MOCK_ADS.filter(
    (ad) =>
      ad.slotId === slotId &&
      new Date(ad.startTime).getTime() <= nowMs &&
      new Date(ad.endTime).getTime() > nowMs
  );
}

export function getRandomActiveAdForSlot(slotId: string): AdEntry | null {
  const ads = getActiveAdsForSlot(slotId);
  if (ads.length === 0) return null;
  return ads[Math.floor(Math.random() * ads.length)];
}

export function getAllActiveAds(): AdEntry[] {
  const nowMs = Date.now();
  return MOCK_ADS.filter(
    (ad) =>
      new Date(ad.startTime).getTime() <= nowMs &&
      new Date(ad.endTime).getTime() > nowMs
  );
}
