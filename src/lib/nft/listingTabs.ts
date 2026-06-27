export type NftListingTab = 'premium' | 'partners' | 'standard' | 'modules' | 'tools';

export const NFT_LISTING_TABS: { value: NftListingTab; label: string }[] = [
  { value: 'premium', label: 'Premium' },
  { value: 'partners', label: 'Partners' },
  { value: 'standard', label: 'Standard' },
  { value: 'modules', label: 'Modules' },
  { value: 'tools', label: 'Tools' },
];

export const NFT_LISTING_TAB_VALUES = new Set<string>(NFT_LISTING_TABS.map((t) => t.value));
