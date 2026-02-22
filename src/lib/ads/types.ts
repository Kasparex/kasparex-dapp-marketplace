export type AdSlotId =
  | 'HALO_DAPPS_RIGHT'
  | 'HALO_MAGAZINES_RIGHT'
  | 'SIDEBAR_RANDOM'
  | 'FOOTER_BLOCK';

export type RotationType = 'static' | 'slider' | 'random';

export interface AdSlotConfig {
  id: AdSlotId;
  label: string;
  pricePerDay: number;
  pricePer30Days: number;
  maxAds: number;
  rotation?: RotationType;
}

export interface AdEntry {
  id: string;
  slotId: AdSlotId;
  imageUrl: string;
  link: string;
  title: string;
  startTime: string;
  endTime: string;
  priorityWeight?: number;
}
