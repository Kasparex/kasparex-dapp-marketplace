import type { AdSlotConfig } from './types';

export const AD_SLOTS: AdSlotConfig[] = [
  {
    id: 'HALO_DAPPS_RIGHT',
    label: 'dApps Halo (right)',
    pricePerDay: 100,
    maxAds: 5,
    rotation: 'slider',
  },
  {
    id: 'HALO_HUB_RIGHT',
    label: 'Hub Halo (right)',
    pricePerDay: 100,
    maxAds: 5,
    rotation: 'slider',
  },
  {
    id: 'HALO_PROTOCOLS_RIGHT',
    label: 'Protocols Halo (right)',
    pricePerDay: 100,
    maxAds: 5,
    rotation: 'slider',
  },
  {
    id: 'HALO_MAGAZINES_RIGHT',
    label: 'Magazines Halo (right)',
    pricePerDay: 100,
    maxAds: 5,
    rotation: 'slider',
  },
  {
    id: 'HALO_CHRONICLES_RIGHT',
    label: 'Chronicles Halo (right)',
    pricePerDay: 100,
    maxAds: 5,
    rotation: 'slider',
  },
  {
    id: 'HALO_VBLOG_RIGHT',
    label: 'vBlog Halo (right)',
    pricePerDay: 100,
    maxAds: 5,
    rotation: 'slider',
  },
  {
    id: 'HALO_NFT_RIGHT',
    label: 'NFT Tools Halo (right)',
    pricePerDay: 100,
    maxAds: 5,
    rotation: 'slider',
  },
  {
    id: 'HALO_DONATIONS_RIGHT',
    label: 'CrowdKAS Halo (right)',
    pricePerDay: 100,
    maxAds: 5,
    rotation: 'slider',
  },
  {
    id: 'HALO_STORE_RIGHT',
    label: 'Store Halo (right)',
    pricePerDay: 100,
    maxAds: 5,
    rotation: 'slider',
  },
  {
    id: 'HALO_GAMES_RIGHT',
    label: 'Games Halo (right)',
    pricePerDay: 100,
    maxAds: 5,
    rotation: 'slider',
  },
  {
    id: 'HALO_AI_RIGHT',
    label: 'Kasparex AI Halo (right)',
    pricePerDay: 100,
    maxAds: 5,
    rotation: 'slider',
  },
  {
    id: 'HALO_STATS_RIGHT',
    label: 'Kasparex Stats Halo (right)',
    pricePerDay: 100,
    maxAds: 5,
    rotation: 'slider',
  },
  {
    id: 'HALO_TOKENS_RIGHT',
    label: 'Tokens Halo (right)',
    pricePerDay: 100,
    maxAds: 5,
    rotation: 'slider',
  },
  {
    id: 'HALO_ADS_RIGHT',
    label: 'Ads Halo (right)',
    pricePerDay: 100,
    maxAds: 5,
    rotation: 'slider',
  },
  {
    id: 'HALO_REWARDS_RIGHT',
    label: 'Rewards Halo (right)',
    pricePerDay: 100,
    maxAds: 5,
    rotation: 'slider',
  },
  {
    id: 'HALO_API_RIGHT',
    label: 'API Halo (right)',
    pricePerDay: 100,
    maxAds: 5,
    rotation: 'slider',
  },
  // VBLOG_ARTICLE_ASIDE_BOTTOM: legacy id still valid in metadata; merged into HALO_VBLOG_RIGHT for display.
  {
    id: 'SIDEBAR_RANDOM',
    label: 'Sidebar',
    pricePerDay: 80,
    maxAds: 10,
    rotation: 'random',
  },
  {
    id: 'FOOTER_BLOCK',
    label: 'Footer block',
    pricePerDay: 50,
    maxAds: 6,
    rotation: 'static',
  },
];

export function getSlotConfig(slotId: string): AdSlotConfig | undefined {
  return AD_SLOTS.find((s) => s.id === slotId);
}

/** Total KAS for a campaign of `days` on this slot */
export function priceKasForDays(slot: AdSlotConfig, days: number): number {
  if (days < 1) return 0;
  return slot.pricePerDay * days;
}
