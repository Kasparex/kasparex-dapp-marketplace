'use client';

import { useCallback, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { resolveTokenAmountFromKas } from '@/lib/pricing/registry';
import type { PricingSnapshot } from '@/lib/pricing/types';
import { transferKrc20 } from '@/lib/payments/krc20Payment';
import { listPublicVerifiedPaymentTokens } from '@/lib/payments/publicPaymentTokens';
import type { StorePaymentCurrency } from '@/lib/store/currencies';
import { payKasPaymentPlan } from '@/lib/payments/kasMultiOutPay';
import { buildHubPlatformFeePlan } from '@/lib/payments/paymentPlan';
import { payHubTokenRailKasFee } from '@/lib/payments/tokenRailKasFee';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';

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
        throw new Error('Connect your Kaspa wallet to purchase credits');
      }
      if (state.provider !== 'kasware' && state.provider !== 'kastle') {
        throw new Error('Comment credits purchase requires KasWare or Kastle on L1');
      }

      setIsProcessing(true);
      setError(null);

      try {
        const treasuryAddress = COMMENT_CREDITS_TREASURY.replace(/^kaspa:/, '');
        const currencyId = String(currency || 'KAS').trim();

        if (currencyId.startsWith('kcc20:')) {
          throw new Error(
            'KCC-20 Hub fee settlement is enabling next. Pay with KAS, KREX, or a KRC-20 for now.',
          );
        }

        if (currencyId === 'KREX') {
          const amountKrex = resolveTokenAmountFromKas(feeKas, 'KREX', pricingSnapshot);
          if (krexL1Balance + 1e-12 < amountKrex) {
            throw new Error('Insufficient KREX balance');
          }
          const tokenTx = await transferKrc20(state.provider, {
            tick: 'KREX',
            amount: amountKrex,
            to: treasuryAddress,
          });
          await payHubTokenRailKasFee({
            provider: state.provider,
            senderAddress: state.address,
            treasuryAddress: COMMENT_CREDITS_TREASURY,
            feeKas,
            note: `Comment Credits Purchase: ${credits} credits`,
          });
          return extractKaspaTransactionId(tokenTx) ?? tokenTx;
        }

        if (currencyId !== 'KAS') {
          const tick = currencyId.toUpperCase();
          const match = listPublicVerifiedPaymentTokens().find(
            (t) => t.kind === 'krc20' && (t.tick === tick || t.id === tick),
          );
          const amount = resolveTokenAmountFromKas(feeKas, tick, pricingSnapshot);
          const tokenTx = await transferKrc20(state.provider, {
            tick,
            amount,
            to: treasuryAddress,
            decimals: match?.decimals ?? 8,
          });
          await payHubTokenRailKasFee({
            provider: state.provider,
            senderAddress: state.address,
            treasuryAddress: COMMENT_CREDITS_TREASURY,
            feeKas,
            note: `Comment Credits Purchase: ${credits} credits`,
          });
          return extractKaspaTransactionId(tokenTx) ?? tokenTx;
        }

        const plan = buildHubPlatformFeePlan({
          totalKas: feeKas,
          treasuryAddress: COMMENT_CREDITS_TREASURY,
          note: `Comment Credits Purchase: ${credits} credits`,
        });
        const result = await payKasPaymentPlan(state.provider, plan, state.address);
        if (!result.txHash) {
          throw new Error('Transaction failed');
        }
        return result.txHash;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Payment failed';
        setError(message);
        throw err;
      } finally {
        setIsProcessing(false);
      }
    },
    [state.isConnected, state.address, state.provider, krexL1Balance],
  );

  return { payCredits, isProcessing, error, setError, treasuryAddress: COMMENT_CREDITS_TREASURY };
}
