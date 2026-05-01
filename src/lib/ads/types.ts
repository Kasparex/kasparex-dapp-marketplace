export type AdSlotId =
  | 'HALO_DAPPS_RIGHT'
  | 'HALO_PROTOCOLS_RIGHT'
  | 'HALO_MAGAZINES_RIGHT'
  | 'HALO_CHRONICLES_RIGHT'
  | 'HALO_VBLOG_RIGHT'
  | 'HALO_NFT_RIGHT'
  | 'HALO_DONATIONS_RIGHT'
  | 'HALO_GAMES_RIGHT'
  | 'GAMES_PLAY_RAIL_RIGHT'
  | 'VBLOG_ARTICLE_ASIDE_BOTTOM'
  | 'SIDEBAR_RANDOM'
  | 'FOOTER_BLOCK';

/** Visual format / template type for ad display (mosaic layout). */
export type AdFormat = 'square' | 'rectangle' | 'tall';

export type RotationType = 'static' | 'slider' | 'random';

export interface AdSlotConfig {
  id: AdSlotId;
  label: string;
  /** KAS per day (linear pricing: total = days * pricePerDay) */
  pricePerDay: number;
  maxAds: number;
  rotation?: RotationType;
}

export interface AdEntry {
  id: string;
  slotId: AdSlotId;
  /** Cell index within the slot grid (0 .. maxAds-1) */
  slotIndex?: number;
  /** Paid featured capsule - stronger border / emphasis in listings. */
  featuredHighlight?: boolean;
  /** Template type for mosaic layout: square, wide rectangle, or tall rectangle. */
  format: AdFormat;
  imageUrl: string;
  link: string;
  title: string;
  /** Short optional message shown in the standard site tooltip on hover. */
  promoTooltip?: string;
  startTime: string;
  endTime: string;
  priorityWeight?: number;
  /** L1 payer from campaign metadata */
  payerL1?: string;
  metadataCid?: string;
  txId?: string;
}
