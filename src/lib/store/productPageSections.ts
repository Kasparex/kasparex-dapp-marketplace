export type StoreProductContentTab = 'product' | 'info' | 'modules' | 'seller' | 'comments';

export const STORE_PRODUCT_TABS: {
  id: StoreProductContentTab;
  label: string;
  sidebarId: string;
}[] = [
  { id: 'product', label: 'Product', sidebarId: 'store-tab-product' },
  { id: 'info', label: 'Info', sidebarId: 'store-tab-info' },
  { id: 'modules', label: 'Modules', sidebarId: 'store-tab-modules' },
  { id: 'seller', label: 'More from This Seller', sidebarId: 'store-tab-seller' },
  { id: 'comments', label: 'Comments', sidebarId: 'store-tab-comments' },
];

/** @deprecated Scroll sections replaced by tabbed layout. */
export const STORE_PRODUCT_SECTIONS = STORE_PRODUCT_TABS.map((tab) => ({
  id: tab.sidebarId,
  label: tab.label,
}));

export type StoreProductSectionId = (typeof STORE_PRODUCT_SECTIONS)[number]['id'];
