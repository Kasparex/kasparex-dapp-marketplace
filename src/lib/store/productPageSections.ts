export const STORE_PRODUCT_SECTIONS = [
  { id: 'product-overview', label: 'Overview' },
  { id: 'product-content', label: 'Premium content' },
  { id: 'product-comments', label: 'Comments' },
] as const;

export type StoreProductSectionId = (typeof STORE_PRODUCT_SECTIONS)[number]['id'];
