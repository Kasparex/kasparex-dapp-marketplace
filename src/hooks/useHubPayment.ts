'use client';

import { useCallback, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { transferKrc20 } from '@/lib/payments/krc20Payment';
import { transferKcc20Payment } from '@/lib/payments/kcc20Payment';
import { payKasPaymentPlan } from '@/lib/payments/kasMultiOutPay';
import {
  buildHubPlatformFeePlan,
  paymentPlanPrimaryAddress,
  type PaymentPlan,
} from '@/lib/payments/paymentPlan';
import { payHubTokenRailKasFee } from '@/lib/payments/tokenRailKasFee';
import { resolveTokenAmountFromKas } from '@/lib/pricing/registry';
import type { PricingSnapshot } from '@/lib/pricing/types';
import type { HubPaymentCurrencyOption } from '@/lib/payments/hubPaymentTypes';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';

export type HubPayParams = {
  /** Preferred: full multi-leg plan (KAS rail). */
  plan?: PaymentPlan;
  /** Legacy single-destination KAS/KREX/KRC-20. */
  amountKas?: number;
  amountDirect?: number;
  to?: string;
  note?: string;
  payloadHex?: string;
  pricingSnapshot?: PricingSnapshot | null;
};

export function useHubPayment() {
  const { state } = useKaspaWallet();
  const { balance: krexL1Balance } = useKREXBalance();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pay = useCallback(
    async (currency: HubPaymentCurrencyOption, params: HubPayParams): Promise<string> => {
      if (!state.isConnected || !state.address || !state.provider) {
        throw new Error('Connect your Kaspa wallet to pay');
      }

      setIsProcessing(true);
      setError(null);

      try {
        if (currency.kind === 'kcc20') {
          const to =
            params.to?.trim() ||
            (params.plan ? paymentPlanPrimaryAddress(params.plan) : '') ||
            '';
          if (!to) throw new Error('Recipient address is not configured');
          const amount =
            params.amountDirect ??
            params.amountKas ??
            (params.plan ? params.plan.legs.reduce((s, l) => s + l.amount, 0) : 0);
          if (!(amount > 0)) throw new Error('Invalid KCC-20 payment amount');
          const result = await transferKcc20Payment({
            currency,
            amount,
            toAddress: to,
            senderAddress: state.address,
            provider: state.provider,
          });
          if (!result.ok) {
            const suffix = result.tradeUrl ? ` ${result.tradeUrl}` : '';
            throw new Error(`${result.error}${suffix}`);
          }
          return result.txHash;
        }

        if (currency.kind === 'krc20') {
          const treasury = (params.to ?? '').replace(/^kaspa:/i, '');
          if (!treasury) throw new Error('Recipient address is not configured');
          let amount = params.amountDirect;
          if (amount == null || amount <= 0) {
            const feeKas =
              params.amountKas ??
              (params.plan ? params.plan.legs.reduce((s, l) => s + l.amount, 0) : undefined);
            if (feeKas == null || feeKas <= 0) throw new Error('Invalid token amount');
            amount = resolveTokenAmountFromKas(
              feeKas,
              currency.tick ?? currency.id,
              params.pricingSnapshot,
            );
          }
          if (amount == null || amount <= 0) throw new Error('Invalid token amount');
          const tokenTx = await transferKrc20(state.provider, {
            tick: currency.tick ?? currency.id,
            amount,
            to: treasury,
            decimals: currency.decimals ?? 8,
          });
          await payHubTokenRailKasFee({
            provider: state.provider,
            senderAddress: state.address,
            treasuryAddress: treasury,
            feeKas:
              params.amountKas ??
              (params.plan ? params.plan.legs.reduce((s, l) => s + l.amount, 0) : 0),
            note: params.note,
            payloadHex: params.payloadHex,
          });
          return extractKaspaTransactionId(tokenTx) ?? tokenTx;
        }

        if (currency.kind === 'krex') {
          const feeKas =
            params.amountKas ??
            (params.plan ? params.plan.legs.reduce((s, l) => s + l.amount, 0) : undefined);
          if (feeKas == null || feeKas <= 0) throw new Error('Invalid payment amount');
          const amountKrex = resolveTokenAmountFromKas(feeKas, 'KREX', params.pricingSnapshot);
          if (krexL1Balance + 1e-12 < amountKrex) {
            throw new Error('Insufficient KREX balance');
          }
          const treasury =
            (params.to ?? (params.plan ? paymentPlanPrimaryAddress(params.plan) : '')).replace(
              /^kaspa:/i,
              '',
            );
          if (!treasury) throw new Error('Recipient address is not configured');
          const tokenTx = await transferKrc20(state.provider, {
            tick: 'KREX',
            amount: amountKrex,
            to: treasury,
          });
          await payHubTokenRailKasFee({
            provider: state.provider,
            senderAddress: state.address,
            treasuryAddress: treasury,
            feeKas,
            note: params.note,
            payloadHex: params.payloadHex,
          });
          return extractKaspaTransactionId(tokenTx) ?? tokenTx;
        }

        // KAS rail: prefer explicit plan, else build platform fee plan from amount + to.
        let plan = params.plan;
        if (!plan) {
          const feeKas = params.amountKas;
          const to = params.to;
          if (feeKas == null || feeKas <= 0) throw new Error('Invalid payment amount');
          if (!to) throw new Error('Recipient address is not configured');
          plan = buildHubPlatformFeePlan({
            totalKas: feeKas,
            treasuryAddress: to,
            note: params.note,
            payloadHex: params.payloadHex,
          });
        } else if (params.note || params.payloadHex) {
          plan = {
            ...plan,
            note: plan.note ?? params.note,
            payloadHex: plan.payloadHex ?? params.payloadHex,
          };
        }

        const result = await payKasPaymentPlan(state.provider, plan, state.address);
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

  return { pay, isProcessing, error, setError };
}
