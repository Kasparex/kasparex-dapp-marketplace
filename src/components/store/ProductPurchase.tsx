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
import { Alert } from '@/components/Alert';
import {
  getProductPaymentCurrency,
} from '@/lib/store/currencies';
import { buildHubCheckoutCurrencyOptions } from '@/lib/payments/hubPaymentTypes';
import { buildPublicHubCurrencyCatalog } from '@/lib/payments/publicPaymentTokens';
import { buildCreatorPlatformPlan } from '@/lib/payments/paymentPlan';
import { splitTokenPayment } from '@/lib/payments/splitTokenPayment';
import { hubPaymentSplitFooter } from '@/lib/payments/paymentSplitCopy';
import type { Product } from '@/lib/store/types';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useIntegratedTokens } from '@/hooks/useIntegratedToken';
import { resolveStoreUnitPrice } from '@/lib/store/checkoutPriceOptions';
import { useHubPayWithCatalog } from '@/hooks/useHubPayWithCatalog';
import {
  formatKasEq,
  formatTokenAmount,
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
  const { tokens: sellerIntegratedTokens } = useIntegratedTokens(product.sellerAddress, 'store');
  const [currency, setCurrency] = useState<string>('KAS');
  const { pricingSnapshot } = useHubPayWithCatalog({
    amountKas: listedCurrency === 'KAS' ? product.priceKAS : undefined,
    integratedTokens: sellerIntegratedTokens,
  });

  const currencyOptions = useMemo(
    () =>
      buildHubCheckoutCurrencyOptions({
        listedCurrency,
        integratedTokens: sellerIntegratedTokens,
      }),
    [listedCurrency, sellerIntegratedTokens],
  );

  const selectedOption = currencyOptions.find((c) => c.id === currency) ?? currencyOptions[0];
  const payWithToken = currency !== 'KAS';

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

  const tokenSplit = useMemo(() => {
    if (!payWithToken || !(unitKasEq > 0)) return null;
    return splitTokenPayment(unitPrice, fee.sellerRevenue, unitKasEq);
  }, [payWithToken, unitPrice, fee.sellerRevenue, unitKasEq]);

  /** Wallet signs this token amount first; must match Total token part. */
  const tokenPayAmount = tokenSplit?.sellerToken ?? unitPrice;

  const totalDisplay = useMemo(() => {
    if (tokenSplit) {
      const tokenPart = formatTokenAmount(tokenSplit.sellerToken, currency);
      if (fee.feeAmount > 1e-9) {
        return `${tokenPart} + ${fee.feeAmount.toFixed(4)} KAS`;
      }
      return tokenPart;
    }
    if (selectedOption?.kind === 'krc20' || currency === 'KREX') {
      return formatTokenAmount(unitPrice, currency);
    }
    return `${unitPrice} KAS`;
  }, [tokenSplit, currency, fee.feeAmount, selectedOption, unitPrice]);

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
              label: 'Product price',
              value:
                payWithToken && unitKasEq !== unitPrice
                  ? `${formatTokenAmount(unitPrice, currency)} (${formatKasEq(unitKasEq)})`
                  : payWithToken
                    ? formatTokenAmount(unitPrice, currency)
                    : `${unitPrice} KAS`,
            },
            {
              label: 'Seller receives',
              value: tokenSplit
                ? `${formatTokenAmount(tokenSplit.sellerToken, currency)} (${formatKasEq(fee.sellerRevenue)})`
                : `${fee.sellerRevenue.toFixed(4)} KAS`,
            },
            {
              label: 'Platform fee',
              value: `${fee.feeAmount.toFixed(4)} KAS`,
            },
          ]}
          totalDisplay={totalDisplay}
          totalSubtitle={
            payWithToken
              ? `Wallet signs ${formatTokenAmount(tokenPayAmount, currency)} to seller first${
                  fee.feeAmount > 1e-9 ? `, then ${fee.feeAmount.toFixed(4)} KAS platform fee` : ''
                }. Combined ${formatKasEq(unitKasEq)}.`
              : undefined
          }
          currencies={currencyOptions.length > 1 ? currencyOptions : undefined}
          catalogEntries={buildPublicHubCurrencyCatalog({
            amountKas: unitKasEq * 1,
            pricingSnapshot,
            krexBalance,
            extra: {
              integratedTokens: sellerIntegratedTokens,
              includeKasKrex: true,
            },
          })}
          selectedCurrencyId={currency}
          onCurrencyChange={setCurrency}
          onCatalogSelect={(opt) => setCurrency(opt.id)}
          splitLegs={
            !payWithToken
              ? buildCreatorPlatformPlan({
                  creatorAddress: product.sellerAddress,
                  creatorKas: fee.sellerRevenue,
                  creatorLabel: 'Seller',
                  platformKas: fee.feeAmount,
                }).legs
              : undefined
          }
          splitUnit="KAS"
          splitInfoText={
            payWithToken
              ? undefined
              : hubPaymentSplitFooter()
          }
          infoText={
            payWithToken
              ? `Wallet signs ${formatTokenAmount(tokenPayAmount, currency)} to the seller (matches the token part of Total). Then ${fee.feeAmount.toFixed(4)} KAS platform fee. Combined ${formatKasEq(unitKasEq)}. No double charge.`
              : undefined
          }
          tier={krexTier}
          krexBalance={krexBalance}
          currencyAccent="store"
          flowPreset="hubCheckout"
          flowBusy={isProcessing}
          flowComplete={Boolean(success)}
          footer={
            <button
              type="button"
              onClick={handlePurchase}
              disabled={isProcessing || !state.isConnected}
              className="w-full k-control-btn !bg-[#02abb8] !text-white !border-[#02abb8] disabled:opacity-50"
            >
              {isProcessing ? 'Processing…' : state.isConnected ? 'Purchase' : 'Connect wallet to purchase'}
            </button>
          }
          alerts={
            error || (success && txHash) ? (
              <>
                {error ? (
                  <Alert type="error" compact region>
                    {error}
                  </Alert>
                ) : null}
                {success && txHash ? (
                  <Alert type="success" compact region>
                    Purchase complete.
                  </Alert>
                ) : null}
              </>
            ) : null
          }
        />
      </div>
      {l1Modal ? <HubWalletGateModal isOpen onClose={closeL1Modal} {...l1Modal} /> : null}
    </>
  );
}
