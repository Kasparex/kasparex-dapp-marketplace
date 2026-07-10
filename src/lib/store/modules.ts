export type StoreModuleId = 'featured_badge' | 'buyer_support' | 'purchase_limit';

export type StoreModuleOffer = {
  id: StoreModuleId;
  title: string;
  description: string;
  unlockPriceKas: number;
};

export const STORE_MODULE_OFFERS: StoreModuleOffer[] = [
  {
    id: 'featured_badge',
    title: 'Featured badge',
    description: 'Highlight your listing with a featured badge in Store browse grids.',
    unlockPriceKas: 5,
  },
  {
    id: 'buyer_support',
    title: 'Buyer support link',
    description: 'Show a support or contact URL on the product page for buyers after purchase.',
    unlockPriceKas: 0,
  },
  {
    id: 'purchase_limit',
    title: 'One purchase per wallet',
    description: 'Limit each wallet to a single purchase of this product.',
    unlockPriceKas: 0,
  },
];
