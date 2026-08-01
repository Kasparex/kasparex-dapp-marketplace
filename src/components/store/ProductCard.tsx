'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { Product } from '@/lib/store/types';
import { resolveStoreProductImageUrl } from '@/lib/store/productMedia';
import { storeProductGateConfig } from '@/lib/hub/gateConfigs';
import { useHubListingGate } from '@/hooks/useHubListingGate';
import { HubWalletGateModal } from '@/components/hub/HubWalletGateModal';
import { GameItemCard } from '@/components/games/shop/GameItemCard';
import type { GameItemCurrency } from '@/components/games/shop/GameItemCard';
import { useStoreProductPurchase } from '@/hooks/useStoreProductPurchase';
import { useIntegratedTokens } from '@/hooks/useIntegratedToken';
import { useHubPayWithCatalog } from '@/hooks/useHubPayWithCatalog';
import { KxBadge } from '@/components/ui/KxBadge';
import { KX_CARD_EXCERPT } from '@/lib/ui/kxTypography';
import { getProductPaymentCurrency } from '@/lib/store/currencies';
import { htmlToPlainText } from '@/lib/richText/html';
import { buildStoreCheckoutPriceOptions } from '@/lib/store/checkoutPriceOptions';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { AuthorInline } from '@/components/ui/AuthorInline';
import { formatAddress } from '@/lib/vblog/utils';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const { state } = useKaspaWallet();
  const gateConfig = storeProductGateConfig(product);
  const { promptGate, isOpenable, l1Modal, closeL1Modal } = useHubListingGate(gateConfig);
  const { purchase, isProcessing, error, success, clearError } = useStoreProductPurchase(product);
  const { tokens: sellerIntegratedTokens } = useIntegratedTokens(product.sellerAddress, 'store');

  const thumbnailUrl = resolveStoreProductImageUrl(product);
  const listedCurrency = getProductPaymentCurrency(product);
  const { pricingSnapshot } = useHubPayWithCatalog({
    amountKas: listedCurrency === 'KAS' ? product.priceKAS : undefined,
    integratedTokens: sellerIntegratedTokens,
  });
  const priceOptions = useMemo(
    () => buildStoreCheckoutPriceOptions(product, sellerIntegratedTokens, pricingSnapshot),
    [product, sellerIntegratedTokens, pricingSnapshot],
  );

  const goToProduct = () => {
    router.push(`/store/${product.slug}`);
  };

  return (
    <>
      <GameItemCard
        kxListingAccent="store"
        imageSrc={thumbnailUrl}
        imageAlt={product.title}
        onMediaClick={goToProduct}
        onCardNavigate={goToProduct}
        title={product.title}
        category={product.category}
        titleBelow={
          <AuthorInline
            address={product.sellerAddress}
            displayName={formatAddress(product.sellerAddress)}
            href={`/u/${encodeURIComponent(product.sellerAddress)}`}
            className="min-w-0"
          />
        }
        titleAccessory={
          <KxBadge variant={product.network === 'L1' ? 'sky' : 'teal'}>{product.network}</KxBadge>
        }
        description={<p className={KX_CARD_EXCERPT}>{htmlToPlainText(product.description)}</p>}
        priceOptions={priceOptions}
        defaultCurrency="KAS"
        quantitySelector={{ min: 1, max: 99 }}
        buyDisabled={isProcessing || !state.isConnected}
        buyLabel={isProcessing ? 'Processing...' : success ? 'Purchased!' : 'Buy Now'}
        buyButtonClassName="inline-flex !h-10 w-full min-h-0 items-center justify-center rounded-xl !px-4 !py-0 text-xs font-bold uppercase tracking-wider text-white transition-all hover:brightness-105 disabled:opacity-50 disabled:grayscale [background-color:var(--k-primary)]"
        onBuy={async ({ currency, quantity }) => {
          clearError();
          if (!isOpenable) {
            promptGate();
            return;
          }
          const ok = await purchase(quantity, currency as GameItemCurrency, pricingSnapshot);
          if (ok) {
            router.push(`/store/${product.slug}`);
          }
        }}
        pricingFooterExtra={() =>
          error ? (
            <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>
          ) : null
        }
      />

      {l1Modal ? <HubWalletGateModal isOpen onClose={closeL1Modal} {...l1Modal} /> : null}
    </>
  );
}
