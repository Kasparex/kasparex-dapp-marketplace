import type { AdSlotConfig } from './types';

export const AD_SLOTS: AdSlotConfig[] = [
  {
    id: 'HALO_DAPPS_RIGHT',
    label: 'dApps Halo (right)',
    pricePerDay: 100,
    pricePer30Days: 1000,
    maxAds: 5,
    rotation: 'slider',
  },
  {
    id: 'HALO_MAGAZINES_RIGHT',
    label: 'Magazines Halo (right)',
    pricePerDay: 100,
    pricePer30Days: 1000,
    maxAds: 5,
    rotation: 'slider',
  },
  {
    id: 'SIDEBAR_RANDOM',
    label: 'Sidebar',
    pricePerDay: 80,
    pricePer30Days: 800,
    maxAds: 10,
    rotation: 'random',
  },
  {
    id: 'FOOTER_BLOCK',
    label: 'Footer block',
    pricePerDay: 50,
    pricePer30Days: 500,
    maxAds: 6,
    rotation: 'static',
  },
];

export function getSlotConfig(slotId: string): AdSlotConfig | undefined {
  return AD_SLOTS.find((s) => s.id === slotId);
}
