'use client';

import { useCallback, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { resolveTokenAmountFromKas } from '@/lib/pricing/registry';
import type { PricingSnapshot } from '@/lib/pricing/types';
import { listPublicVerifiedPaymentTokens } from '@/lib/payments/publicPaymentTokens';
import type { StorePaymentCurrency } from '@/lib/store/currencies';
import {
  buildHubKasListingPlan,
  payHubKasPlan,
  payHubTokenListingFee,
} from '@/lib/payments/hubPayRail';
import { hubNotify } from '@/lib/hub/notify';

const COMMENT_CREDITS_TREASURY =
  'kaspa:qqd36zqt94yr23cmjj73d34e2lc05ltd9duw582s303m30ux567ps9ljnhp6y';

export function useCommentCreditsPayment() {
  const { state } = useKaspaWallet();
  const { balance: krexL1Balance } = useKREXBalance();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const payCredits = useCallback(
    async (
      currency: StorePaymentCurrency,
      feeKas: number,
      credits: number,
      pricingSnapshot?: PricingSnapshot | null,
    ): Promise<string> => {
      if (!state.isConnected || !state.address || !state.provider) {
        hubNotify.error('Wallet required', 'Connect your Kaspa wallet to purchase credits');
        throw new Error('Connect your Kaspa wallet to purchase credits');
      }
      if (state.provider !== 'kasware' && state.provider !== 'kastle') {
        hubNotify.warning('Wallet unsupported', 'Comment credits require KasWare or Kastle on L1');
        throw new Error('Comment credits purchase requires KasWare or Kastle on L1');
      }

      setIsProcessing(true);
      setError(null);
      const loadingId = hubNotify.loading('Buying credits…', 'Confirm in your wallet');

      try {
        const currencyId = String(currency || 'KAS').trim();
        const note = `Comment Credits Purchase: ${credits} credits`;
        let txHash: string;

        if (currencyId.startsWith('kcc20:')) {
          throw new Error(
            'KCC-20 Hub fee settlement is enabling next. Pay with KAS, KREX, or a KRC-20 for now.',
          );
        }

        if (currencyId !== 'KAS') {
          const tick = currencyId === 'KREX' ? 'KREX' : currencyId.toUpperCase();
          const amountToken = resolveTokenAmountFromKas(feeKas, tick, pricingSnapshot);
          if (tick === 'KREX' && krexL1Balance + 1e-12 < amountToken) {
            throw new Error('Insufficient KREX balance');
          }
          const match = listPublicVerifiedPaymentTokens().find(
            (t) => t.kind === 'krc20' && (t.tick === tick || t.id === tick),
          );
          const paid = await payHubTokenListingFee({
            provider: state.provider,
            senderAddress: state.address,
            tick,
            feeKas,
            amountToken,
            treasuryAddress: COMMENT_CREDITS_TREASURY,
            pricingSnapshot,
            decimals: match?.decimals ?? 8,
            note,
          });
          txHash = paid.kasCommitTxHash ?? paid.tokenTxHash;
        } else {
          const plan = buildHubKasListingPlan({
            feeKas,
            treasuryAddress: COMMENT_CREDITS_TREASURY,
            note,
          });
          txHash = await payHubKasPlan({
            provider: state.provider,
            senderAddress: state.address,
            plan,
          });
        }

        hubNotify.txSuccess({
          id: loadingId,
          title: 'Credits purchased',
          description: `${credits} comment credits added`,
          txHash,
        });
        return txHash;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Payment failed';
        setError(message);
        hubNotify.update(loadingId, {
          title: 'Purchase failed',
          description: message,
          variant: 'error',
        });
        throw err;
      } finally {
        setIsProcessing(false);
      }
    },
    [state.isConnected, state.address, state.provider, krexL1Balance],
  );

  return { payCredits, isProcessing, error, setError, treasuryAddress: COMMENT_CREDITS_TREASURY };
}
