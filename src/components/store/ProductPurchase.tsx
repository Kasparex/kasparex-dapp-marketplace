'use client';

import { useMemo, useState } from 'react';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { calculatePlatformFee } from '@/lib/store/fees';
import { useStoreProductPurchase } from '@/hooks/useStoreProductPurchase';
import { useHubListingGate } from '@/hooks/useHubListingGate';
import { storeProductGateConfig } from '@/lib/hub/gateConfigs';
import { HubWalletGateModal } from '@/components/hub/HubWalletGateModal';
import { HubPaymentPanel } from '@/components/payments/HubPaymentPanel';
import {
  getProductPaymentCurrency,
  isBuiltinStoreCurrency,
} from '@/lib/store/currencies';
import { buildHubCheckoutCurrencyOptions } from '@/lib/payments/hubPaymentTypes';
import type { Product } from '@/lib/store/types';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useIntegratedToken } from '@/hooks/useIntegratedToken';
import { resolveStoreUnitPrice } from '@/lib/store/checkoutPriceOptions';
import { usePricingSnapshot } from '@/hooks/usePricingSnapshot';
import {
  formatKasEq,
  formatTokenAmount,
  mergePricingTickers,
  toKasEq,
} from '@/lib/pricing';

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
  const { tier: krexTier, balance: krexBalance } = useKREXBalance();
  const { nftStatus } = useNFTStatus();
  const gateConfig = storeProductGateConfig(product);
  const { promptGate, isOpenable, l1Modal, closeL1Modal } = useHubListingGate(gateConfig);
  const { purchase, isProcessing, error, success, txHash } = useStoreProductPurchase(product);

  const listedCurrency = getProductPaymentCurrency(product);
  const sellerIntegratedToken = useIntegratedToken(product.sellerAddress, 'store').token;
  const [currency, setCurrency] = useState<string>(listedCurrency);
  const pricingTickers = useMemo(
    () => mergePricingTickers([listedCurrency, currency, 'KREX', sellerIntegratedToken?.tick ?? '']),
    [listedCurrency, currency, sellerIntegratedToken?.tick],
  );
  const { snapshot: pricingSnapshot } = usePricingSnapshot(pricingTickers);

  const currencyOptions = useMemo(
    () => buildHubCheckoutCurrencyOptions({ listedCurrency, integratedToken: sellerIntegratedToken }),
    [listedCurrency, sellerIntegratedToken],
  );

  const selectedOption = currencyOptions.find((c) => c.id === currency) ?? currencyOptions[0];

  const unitPrice = useMemo(
    () => resolveStoreUnitPrice(product, currency, pricingSnapshot),
    [product, currency, pricingSnapshot],
  );

  const unitKasEq = useMemo(
    () => toKasEq(unitPrice, currency, pricingSnapshot) ?? unitPrice,
    [unitPrice, currency, pricingSnapshot],
  );

  const fee = useMemo(() => {
    return calculatePlatformFee(unitKasEq, krexTier, nftStatus);
  }, [unitKasEq, krexTier, nftStatus]);

  const totalDisplay = useMemo(() => {
    if (selectedOption?.kind === 'krc20' || currency === 'KREX') {
      return formatTokenAmount(unitPrice, currency);
    }
    return `${unitPrice} KAS`;
  }, [selectedOption, unitPrice, currency]);

  const handlePurchase = async () => {
    if (!isOpenable) {
      promptGate();
      return;
    }
    const ok = await purchase(1, currency, pricingSnapshot);
    if (ok && onPurchaseComplete) onPurchaseComplete();
  };

  return (
    <>
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-5">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Purchase product</h3>
          <p className="kx-body">
            Pay from your connected Kaspa wallet. Seller: {formatSellerAddress(product.sellerAddress)}
          </p>
        </div>

        <HubPaymentPanel
          title="Checkout"
          lines={[
            {
              label: 'Unit price',
              value:
                currency !== 'KAS' && unitKasEq !== unitPrice
                  ? `${totalDisplay} (${formatKasEq(unitKasEq)})`
                  : totalDisplay,
            },
            { label: 'Platform fee', value: `${fee.feeAmount.toFixed(4)} KAS` },
            { label: 'Seller receives', value: `${fee.sellerRevenue.toFixed(4)} KAS` },
          ]}
          totalDisplay={totalDisplay}
          currencies={currencyOptions.length > 1 ? currencyOptions : undefined}
          selectedCurrencyId={currency}
          onCurrencyChange={setCurrency}
          currencyToggleMode="menu"
          tier={krexTier}
          krexBalance={krexBalance}
          footer={
            <>
              {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
              {success && txHash ? (
                <p className="text-sm text-emerald-600 dark:text-emerald-400">Purchase complete.</p>
              ) : null}
              <button
                type="button"
                onClick={handlePurchase}
                disabled={isProcessing || !state.isConnected}
                className="w-full k-control-btn !bg-[#02abb8] !text-white !border-[#02abb8] disabled:opacity-50"
              >
                {isProcessing ? 'Processing…' : state.isConnected ? 'Purchase' : 'Connect wallet to purchase'}
              </button>
            </>
          }
        />
      </div>
      {l1Modal ? <HubWalletGateModal isOpen onClose={closeL1Modal} {...l1Modal} /> : null}
    </>
  );
}
