'use client';

import { useMemo, useState } from 'react';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { calculatePlatformFee } from '@/lib/store/fees';
import { useStoreProductPurchase } from '@/hooks/useStoreProductPurchase';
import { useHubListingGate } from '@/hooks/useHubListingGate';
import { storeProductGateConfig } from '@/lib/hub/gateConfigs';
import { HubWalletGateModal } from '@/components/hub/HubWalletGateModal';
import { GameCurrencyMenu } from '@/components/games/shop/GameCurrencyMenu';
import type { GameItemCurrency } from '@/components/games/shop/GameItemCard';
import {
  getProductPaymentCurrency,
  getProductPriceOptions,
  krexToKasAmount,
} from '@/lib/store/currencies';
import type { Product } from '@/lib/store/types';
import { useKaspaWallet } from '@/lib/kaspa/context';

interface ProductPurchaseProps {
  product: Product;
  onPurchaseComplete?: () => void;
}

function formatSellerAddress(address: string): string {
  if (address.length <= 16) return address;
  return `${address.slice(0, 10)}...${address.slice(-6)}`;
}

export function ProductPurchase({ product, onPurchaseComplete }: ProductPurchaseProps) {
  const { state } = useKaspaWallet();
  const { tier: krexTier } = useKREXBalance();
  const { nftStatus } = useNFTStatus();
  const gateConfig = storeProductGateConfig(product);
  const { promptGate, isOpenable, l1Modal, closeL1Modal } = useHubListingGate(gateConfig);
  const { purchase, isProcessing, error, success, txHash } = useStoreProductPurchase(product);

  const listedCurrency = getProductPaymentCurrency(product);
  const priceOptions = getProductPriceOptions(product);
  const [currency, setCurrency] = useState<GameItemCurrency>(listedCurrency);

  const unitPrice = useMemo(
    () => priceOptions.find((o) => o.currency === currency)?.unitPrice ?? product.priceKAS,
    [priceOptions, currency, product.priceKAS],
  );

  const fee = useMemo(() => {
    const totalKas = currency === 'KREX' ? krexToKasAmount(unitPrice) : unitPrice;
    return calculatePlatformFee(totalKas, krexTier, nftStatus);
  }, [currency, unitPrice, krexTier, nftStatus]);

  const handlePurchase = async () => {
    if (!isOpenable) {
      promptGate();
      return;
    }
    const ok = await purchase(1, currency);
    if (ok && onPurchaseComplete) onPurchaseComplete();
  };

  const menuOptions = priceOptions.map((o) => ({
    value: o.currency,
    label: `${o.unitPrice.toLocaleString(undefined, { maximumFractionDigits: o.currency === 'KREX' ? 2 : 6 })} ${o.currency}`,
  }));

  return (
    <>
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-5">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Purchase product</h3>
          <p className="kx-body">
            Pay with KAS or KREX from your connected Kaspa wallet.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Price</span>
            {priceOptions.length > 1 ? (
              <GameCurrencyMenu
                ariaLabel="Payment currency"
                value={String(currency)}
                onChange={(v) => setCurrency(v as GameItemCurrency)}
                options={menuOptions}
                className="min-w-[170px]"
              />
            ) : (
              <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {unitPrice} {listedCurrency}
              </span>
            )}
          </div>
          {fee.feePercent > 0 && (
            <div className="flex items-center justify-between text-xs border-t border-zinc-200 dark:border-zinc-800 pt-2">
              <span className="text-zinc-500">Platform fee ({fee.feePercent.toFixed(2)}%)</span>
              <span>{fee.feeAmount.toFixed(4)} KAS eq.</span>
            </div>
          )}
          {fee.feePercent < 5 && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400">KREX/NFT holder discount applied</p>
          )}
        </div>

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Seller</p>
          <p className="text-sm font-mono text-zinc-800 dark:text-zinc-200 break-all" title={product.sellerAddress}>
            {formatSellerAddress(product.sellerAddress)}
          </p>
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
          disabled={isProcessing || success || !state.isConnected}
          className="w-full k-cta-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {!state.isConnected
            ? 'Connect wallet to buy'
            : isProcessing
              ? 'Processing...'
              : success
                ? 'Purchase complete'
                : `Buy for ${unitPrice.toLocaleString(undefined, { maximumFractionDigits: currency === 'KREX' ? 2 : 6 })} ${currency}`}
        </button>
      </div>

      {l1Modal ? <HubWalletGateModal isOpen onClose={closeL1Modal} {...l1Modal} /> : null}
    </>
  );
}
