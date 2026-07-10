'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { Product } from '@/lib/store/types';
import { getBestGatewayUrl } from '@/lib/ipfs/gateway';
import { storeProductGateConfig } from '@/lib/hub/gateConfigs';
import { useHubListingGate } from '@/hooks/useHubListingGate';
import { HubWalletGateModal } from '@/components/hub/HubWalletGateModal';
import { GameItemCard } from '@/components/games/shop/GameItemCard';
import type { GameItemCurrency } from '@/components/games/shop/GameItemCard';
import { useStoreProductPurchase } from '@/hooks/useStoreProductPurchase';
import { useIntegratedToken } from '@/hooks/useIntegratedToken';
import { usePricingSnapshot } from '@/hooks/usePricingSnapshot';
import { KxBadge } from '@/components/ui/KxBadge';
import { KX_CARD_EXCERPT } from '@/lib/ui/kxTypography';
import { getProductPaymentCurrency } from '@/lib/store/currencies';
import { buildStoreCheckoutPriceOptions } from '@/lib/store/checkoutPriceOptions';
import { mergePricingTickers } from '@/lib/pricing/registry';
import { useKaspaWallet } from '@/lib/kaspa/context';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const { state } = useKaspaWallet();
  const gateConfig = storeProductGateConfig(product);
  const { promptGate, isOpenable, l1Modal, closeL1Modal } = useHubListingGate(gateConfig);
  const { purchase, isProcessing, error, success, clearError } = useStoreProductPurchase(product);
  const { token: sellerIntegratedToken } = useIntegratedToken(product.sellerAddress, 'store');

  const thumbnailUrl = product.thumbnailCid ? getBestGatewayUrl(product.thumbnailCid) : undefined;
  const listedCurrency = getProductPaymentCurrency(product);
  const pricingTickers = useMemo(
    () => mergePricingTickers([listedCurrency, 'KREX', sellerIntegratedToken?.tick ?? '']),
    [listedCurrency, sellerIntegratedToken?.tick],
  );
  const { snapshot: pricingSnapshot } = usePricingSnapshot(pricingTickers);
  const priceOptions = useMemo(
    () => buildStoreCheckoutPriceOptions(product, sellerIntegratedToken, pricingSnapshot),
    [product, sellerIntegratedToken, pricingSnapshot],
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
        titleAccessory={
          <KxBadge variant={product.network === 'L1' ? 'sky' : 'teal'}>{product.network}</KxBadge>
        }
        description={<p className={KX_CARD_EXCERPT}>{product.description}</p>}
        priceOptions={priceOptions}
        defaultCurrency={listedCurrency}
        quantitySelector={{ min: 1, max: 99 }}
        buyDisabled={isProcessing || !state.isConnected}
        buyLabel={isProcessing ? 'Processing...' : success ? 'Purchased!' : 'Buy'}
        buyButtonClassName="k-cta-primary flex h-10 w-[5.25rem] shrink-0 items-center justify-center px-3 text-xs font-bold disabled:opacity-50 disabled:grayscale"
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
