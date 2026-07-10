export type StoreSellerTab = 'purchased' | 'products' | 'create';

export function parseStoreSellerTab(value: string | null): StoreSellerTab {
  switch (value) {
    case 'purchased':
      return 'purchased';
    case 'create':
      return 'create';
    case 'products':
    default:
      return 'products';
  }
}

export function storeSellerTabHref(tab: StoreSellerTab): string {
  return tab === 'products' ? '/store/dashboard' : `/store/dashboard?tab=${tab}`;
}
