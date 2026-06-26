'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Product } from '@/lib/store/types';
import { getBestGatewayUrl } from '@/lib/ipfs/gateway';
import { storeProductGateConfig } from '@/lib/hub/gateConfigs';
import { useHubListingGate } from '@/hooks/useHubListingGate';
import { HubWalletGateModal } from '@/components/hub/HubWalletGateModal';
import { GameItemCard } from '@/components/games/shop/GameItemCard';
import { useStoreProductPurchase } from '@/hooks/useStoreProductPurchase';
import { calculatePlatformFee } from '@/lib/store/fees';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
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
  const { tier: krexTier } = useKREXBalance();
  const { nftStatus } = useNFTStatus();

  const thumbnailUrl = product.thumbnailCid ? getBestGatewayUrl(product.thumbnailCid) : undefined;
  const fee = calculatePlatformFee(product.priceKAS, krexTier, nftStatus);

  const goToProduct = () => {
    if (!isOpenable) {
      promptGate();
      return;
    }
    router.push(`/store/${product.slug}`);
  };

  return (
    <>
      <GameItemCard
        kxListingAccent="store"
        imageSrc={thumbnailUrl}
        imageAlt={product.title}
        onMediaClick={goToProduct}
        title={product.title}
        category={product.category}
        titleAccessory={
          <span
            className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              product.network === 'L1'
                ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300'
                : 'bg-teal-500/15 text-teal-700 dark:text-teal-300'
            }`}
          >
            {product.network}
          </span>
        }
        description={
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-700 dark:text-cyan-300">
              by {product.sellerAddress.slice(-8)}
            </p>
            <p className="line-clamp-2 text-sm">{product.description}</p>
            <Link
              href={`/store/${product.slug}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-block text-xs font-bold text-[#02abb8] hover:underline"
            >
              View details
            </Link>
          </div>
        }
        effects={[
          { label: 'Unit price', value: `${product.priceKAS} KAS`, color: 'accent' },
          ...(fee.feePercent < 5
            ? [{ label: 'Fee discount', value: `${fee.feePercent.toFixed(1)}%`, color: 'accent' as const }]
            : []),
        ]}
        priceOptions={[{ currency: 'KAS', unitPrice: product.priceKAS }]}
        quantitySelector={{ min: 1, max: 99 }}
        buyDisabled={isProcessing || !state.isConnected}
        buyLabel={isProcessing ? 'Processing...' : success ? 'Purchased!' : 'Buy now'}
        onBuy={async ({ quantity }) => {
          clearError();
          if (!isOpenable) {
            promptGate();
            return;
          }
          const ok = await purchase(quantity);
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
