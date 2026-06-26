'use client';

import { useEffect, useMemo } from 'react';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { calculatePlatformFee } from '@/lib/store/fees';
import { HubWalletGateShell } from '@/components/hub/HubWalletGateShell';
import { storeProductGateConfig } from '@/lib/hub/gateConfigs';
import { useStoreProductPurchase } from '@/hooks/useStoreProductPurchase';
import type { Product } from '@/lib/store/types';

interface ProductPurchaseProps {
  product: Product;
  onPurchaseComplete?: () => void;
}

export function ProductPurchase({ product, onPurchaseComplete }: ProductPurchaseProps) {
  const { tier: krexTier } = useKREXBalance();
  const { nftStatus } = useNFTStatus();
  const gateConfig = { ...storeProductGateConfig(product), autoPrompt: true };
  const { purchase, isProcessing, error, success, txHash } = useStoreProductPurchase(product);

  const fee = useMemo(
    () => calculatePlatformFee(product.priceKAS, krexTier, nftStatus),
    [product.priceKAS, krexTier, nftStatus],
  );

  const handlePurchase = async () => {
    const ok = await purchase(1);
    if (ok && onPurchaseComplete) onPurchaseComplete();
  };

  return (
    <HubWalletGateShell config={gateConfig} mode="overlay">
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Purchase product</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Pay with KAS from your connected wallet.</p>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">Price</span>
              <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{product.priceKAS} KAS</span>
            </div>
            {fee.feePercent > 0 && (
              <div className="flex items-center justify-between text-xs border-t border-zinc-200 dark:border-zinc-800 pt-2">
                <span className="text-zinc-500">Platform fee ({fee.feePercent.toFixed(2)}%)</span>
                <span>{fee.feeAmount.toFixed(4)} KAS</span>
              </div>
            )}
            {fee.feePercent < 5 && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400">KREX/NFT holder discount applied</p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}

          {success && txHash && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
              <p className="text-sm text-emerald-800 dark:text-emerald-300">
                Purchase successful. Tx: {txHash.slice(0, 10)}...{txHash.slice(-8)}
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={handlePurchase}
            disabled={isProcessing || success}
            className="w-full k-cta-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Processing...' : success ? 'Purchase complete' : `Buy for ${product.priceKAS} KAS`}
          </button>
        </div>
      </div>
    </HubWalletGateShell>
  );
}
