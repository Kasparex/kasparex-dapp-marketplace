'use client';

import { getProductPaymentCurrency } from '@/lib/store/currencies';
import type { Product } from '@/lib/store/types';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { KxDataTable, type KxDataTableRow } from '@/components/kx/KxDataTable';
import { StoreProductTags } from '@/components/store/StoreProductTags';
import { normalizeStoreProductTags } from '@/lib/store/tags';

function formatSellerAddress(address: string): string {
  if (address.length <= 20) return address;
  return `${address.slice(0, 12)}...${address.slice(-8)}`;
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
    <span className="inline-flex rounded border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-cyan-800 dark:text-cyan-300">
      {category}
    </span>
  );
}

export function StoreProductInfoSection({ product }: { product: Product }) {
  const listedCurrency = getProductPaymentCurrency(product);
  const tags = normalizeStoreProductTags(product.tags);

  const metadataRows: KxDataTableRow[] = [
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
    metadataRows.push({
      label: 'Tags',
      valueNode: <StoreProductTags tags={tags} />,
      mono: false,
    });
  }

  const listingRows: KxDataTableRow[] = [
    { label: 'Price', value: `${product.priceKAS} ${listedCurrency}`, mono: false },
    { label: 'Listed currency', value: listedCurrency, mono: false },
    { label: 'Seller', value: formatSellerAddress(product.sellerAddress) },
    { label: 'Purchases', value: String(product.purchaseCount ?? 0), mono: false },
  ];

  return (
    <div id="store-tab-info" className="scroll-mt-24 space-y-6">
      <DAppSectionHeader title="Info" className="mb-0" />

      <section>
        <DAppSectionHeader
          title="Metadata"
          hint="Network, category, and listing identifiers for this product."
          className="mb-3"
        />
        <KxDataTable rows={metadataRows} />
      </section>

      <section>
        <DAppSectionHeader title="Listing details" hint="Pricing and seller information." className="mb-3" />
        <KxDataTable rows={listingRows} />
      </section>
    </div>
  );
}
