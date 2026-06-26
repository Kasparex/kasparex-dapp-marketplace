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
    slotIndex: 0,
    format: 'square',
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
    slotIndex: 1,
    format: 'square',
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
    slotIndex: 2,
    format: 'square',
    imageUrl: 'https://placehold.co/400x400/4a1d6b/fff?text=Ad+3',
    link: 'https://kasparex.com',
    title: 'KREX Rewards',
    startTime: past,
    endTime: in7Days,
    priorityWeight: 1,
  },
  {
    id: 'halo-protocols-1',
    slotId: 'HALO_PROTOCOLS_RIGHT',
    slotIndex: 0,
    format: 'square',
    imageUrl: 'https://placehold.co/400x400/0f766e/fff?text=Protocols',
    link: 'https://kasparex.com/ads',
    title: 'Protocols halo placement',
    startTime: past,
    endTime: in30Days,
    priorityWeight: 1,
  },
  {
    id: 'halo-protocols-2',
    slotId: 'HALO_PROTOCOLS_RIGHT',
    slotIndex: 1,
    format: 'square',
    imageUrl: 'https://placehold.co/400x400/155e75/fff?text=kpx',
    link: 'https://kasparex.com',
    title: 'Build on kpx',
    startTime: past,
    endTime: in14Days,
    priorityWeight: 1,
  },
  {
    id: 'halo-chronicles-1',
    slotId: 'HALO_CHRONICLES_RIGHT',
    slotIndex: 0,
    format: 'square',
    imageUrl: 'https://placehold.co/400x400/0f766e/fff?text=Lore',
    link: 'https://kasparex.com/ads',
    title: 'Chronicles placement',
    startTime: past,
    endTime: in30Days,
    priorityWeight: 1,
  },
  {
    id: 'halo-chronicles-2',
    slotId: 'HALO_CHRONICLES_RIGHT',
    slotIndex: 1,
    format: 'square',
    imageUrl: 'https://placehold.co/400x400/155e75/fff?text=KREX',
    link: 'https://kasparex.com',
    title: 'Kasparex ecosystem',
    startTime: past,
    endTime: in14Days,
    priorityWeight: 1,
  },
  {
    id: 'halo-nft-1',
    slotId: 'HALO_NFT_RIGHT',
    slotIndex: 0,
    format: 'square',
    imageUrl: 'https://placehold.co/400x400/0e7490/fff?text=NFT+Tools',
    link: 'https://kasparex.com/ads',
    title: 'NFT Tools placement',
    startTime: past,
    endTime: in30Days,
    priorityWeight: 1,
  },
  {
    id: 'halo-nft-2',
    slotId: 'HALO_NFT_RIGHT',
    slotIndex: 1,
    format: 'square',
    imageUrl: 'https://placehold.co/400x400/164e63/fff?text=KRC721',
    link: 'https://kasparex.com',
    title: 'Kasparex NFTs',
    startTime: past,
    endTime: in14Days,
    priorityWeight: 1,
  },
  {
    id: 'halo-ai-1',
    slotId: 'HALO_AI_RIGHT',
    slotIndex: 0,
    format: 'square',
    imageUrl: 'https://placehold.co/400x400/0e7490/fff?text=Kasparex+AI',
    link: 'https://kasparex.com/ai',
    title: 'Kasparex AI',
    startTime: past,
    endTime: in30Days,
    priorityWeight: 1,
  },
  {
    id: 'halo-ai-2',
    slotId: 'HALO_AI_RIGHT',
    slotIndex: 1,
    format: 'square',
    imageUrl: 'https://placehold.co/400x400/155e75/fff?text=Agent+Hub',
    link: 'https://kasparex.com/ads',
    title: 'Advertise on AI hub',
    startTime: past,
    endTime: in14Days,
    priorityWeight: 1,
  },
  {
    id: 'sidebar-1',
    slotId: 'SIDEBAR_RANDOM',
    slotIndex: 0,
    format: 'rectangle',
    imageUrl: 'https://placehold.co/300x200/2d3748/fff?text=Sidebar',
    link: 'https://kasparex.com/ads',
    title: 'Advertise here',
    startTime: past,
    endTime: in30Days,
  },
  {
    id: 'sidebar-2',
    slotId: 'SIDEBAR_RANDOM',
    slotIndex: 1,
    format: 'rectangle',
    imageUrl: 'https://placehold.co/300x200/1a365d/fff?text=Slot',
    link: 'https://kasparex.com/ads',
    title: 'Kasparex Ads',
    startTime: past,
    endTime: in14Days,
  },
  {
    id: 'footer-1',
    slotId: 'FOOTER_BLOCK',
    slotIndex: 0,
    format: 'rectangle',
    imageUrl: 'https://placehold.co/1200x200/374151/9ca3af?text=Footer+Ad',
    link: 'https://kasparex.com/ads',
    title: 'Footer ad',
    startTime: past,
    endTime: in30Days,
  },
  {
    id: 'footer-2',
    slotId: 'FOOTER_BLOCK',
    slotIndex: 1,
    format: 'rectangle',
    imageUrl: 'https://placehold.co/1200x200/4b5563/9ca3af?text=Ecosystem',
    link: 'https://kasparex.com',
    title: 'Ecosystem',
    startTime: past,
    endTime: in14Days,
  },
  {
    id: 'tall-1',
    slotId: 'SIDEBAR_RANDOM',
    slotIndex: 2,
    format: 'tall',
    imageUrl: 'https://placehold.co/200x300/1f2937/9ca3af?text=Tall',
    link: 'https://kasparex.com/ads',
    title: 'Tall format',
    startTime: past,
    endTime: in30Days,
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
