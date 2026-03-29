/** Stable IDs for purchasable / gateable Chronicles content (extend as catalog grows). */
export type ChroniclesContentId = string;

export type EntitlementOfferKind = 'chapter' | 'lore' | 'character' | 'asset';

export interface EntitlementOffer {
  id: ChroniclesContentId;
  title: string;
  shortDescription: string;
  kind: EntitlementOfferKind;
  /** Shown on locked cards; not a live price yet */
  priceLabel: string;
  /** List price in KAS for on-chain unlock verification */
  basePriceKas: number;
  /** Card / catalog art */
  imageUrl?: string;
  /** Optional in-app route when unlocked */
  targetHref?: string;
}

export interface EntitlementsCatalogFile {
  offers: EntitlementOffer[];
}

export interface EntitlementsMockFile {
  /** Keys must match `useKaspaWallet` addresses (`kaspa:...`). */
  byAddress: Record<string, { unlockedIds: ChroniclesContentId[] }>;
}
