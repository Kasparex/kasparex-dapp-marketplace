'use client';

import { getProductPaymentCurrency } from '@/lib/store/currencies';
import type { Product } from '@/lib/store/types';
import { KxDataTable, type KxDataTableRow } from '@/components/kx/KxDataTable';
import { StoreProductTags } from '@/components/store/StoreProductTags';
import { normalizeStoreProductTags } from '@/lib/store/tags';

function formatSellerAddress(address: string): string {
  if (address.length <= 20) return address;
  return `${address.slice(0, 12)}…${address.slice(-8)}`;
}

function NetworkBadge({ network }: { network: Product['network'] }) {
  return (
    <span
      className={`inline-flex rounded px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${
        network === 'L1'
          ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300'
          : 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300'
      }`}
    >
      {network} Network
    </span>
  );
}

function CategoryBadge({ category }: { category: Product['category'] }) {
  return (
    <span className="inline-flex rounded border border-[color:var(--hub-accent-border)] bg-[color:var(--hub-accent-muted)] px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-[color:var(--hub-accent)]">
      {category}
    </span>
  );
}

export function StoreProductInfoSection({ product }: { product: Product }) {
  const listedCurrency = getProductPaymentCurrency(product);
  const tags = normalizeStoreProductTags(product.tags);

  const rows: KxDataTableRow[] = [
    {
      label: 'Network',
      valueNode: <NetworkBadge network={product.network} />,
      mono: false,
    },
    {
      label: 'Category',
      valueNode: <CategoryBadge category={product.category} />,
      mono: false,
    },
  ];

  if (tags.length > 0) {
    rows.push({
      label: 'Tags',
      valueNode: <StoreProductTags tags={tags} />,
      mono: false,
    });
  }

  rows.push(
    { label: 'Price', value: `${product.priceKAS} ${listedCurrency}`, mono: false },
    { label: 'Listed currency', value: listedCurrency, mono: false },
    { label: 'Seller', value: formatSellerAddress(product.sellerAddress), mono: true },
    { label: 'Purchases', value: String(product.purchaseCount ?? 0), mono: false },
  );

  return (
    <div id="store-tab-info" className="scroll-mt-24 space-y-4">
      <KxDataTable rows={rows} />
    </div>
  );
}
