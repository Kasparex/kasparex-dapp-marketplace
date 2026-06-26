export type StoreSellerTab = 'overview' | 'purchased' | 'products' | 'sales' | 'create';

export function parseStoreSellerTab(value: string | null): StoreSellerTab {
  switch (value) {
    case 'purchased':
      return 'purchased';
    case 'products':
      return 'products';
    case 'sales':
      return 'sales';
    case 'create':
      return 'create';
    default:
      return 'overview';
  }
}

export function storeSellerTabHref(tab: StoreSellerTab): string {
  return tab === 'overview' ? '/store/dashboard' : `/store/dashboard?tab=${tab}`;
}
