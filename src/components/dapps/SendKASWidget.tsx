'use client';

import { useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { sendKaspaTransaction } from '@/lib/kaspa/wallet';
import { kasToSompis } from '@/lib/kaspa/api';
import { isValidKaspaAddress } from '@/lib/kaspa/sdk';
import { KxFormFieldLabel } from '@/components/ui/KxFormFieldLabel';
import { useKaspaBalance } from '@/hooks/useKaspaBalance';
import { DAppWidgetShell } from '@/components/dapps/DAppWidgetShell';
import { useRegisterDAppWidgetRailSlot } from '@/lib/dapps/DAppWidgetActionRailContext';
import { useRegisterHubFlowProgress } from '@/hooks/useRegisterHubFlowProgress';
import { useSyncDAppWidgetQuote } from '@/lib/dapps/PaymentAmountContext';
import { placeholderDApps } from '@/lib/dapps';
import { awardDAppHubPoints } from '@/lib/rewards/awardDAppHubPoints';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { hubNotify } from '@/lib/hub/notify';

export function SendKASWidget() {
  const { state } = useKaspaWallet();
  const { balance: kasBalance, isLoading: isBalanceLoading, refresh: refreshBalance } = useKaspaBalance();
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState(false);

  const { tier, balance: krexBalance } = useKREXBalance();
  const sendKasDApp = placeholderDApps.find((d) => d.slug === 'send-kas');
  const parsedAmount = amount && !Number.isNaN(parseFloat(amount)) ? parseFloat(amount) : null;
  useSyncDAppWidgetQuote(parsedAmount, 'send-kas');

  const handleSend = async () => {
    if (!state.isConnected || !state.provider) {
      hubNotify.error('Wallet required', 'Please connect your Kaspa wallet first');
      return;
    }

    if (!toAddress.trim()) {
      hubNotify.warning('Recipient required', 'Please enter a recipient address');
      return;
    }

    if (!isValidKaspaAddress(toAddress.trim())) {
      hubNotify.warning('Invalid address', 'Please enter a valid Kaspa address');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      hubNotify.warning('Invalid amount', 'Please enter a valid amount');
      return;
    }

    setIsSending(true);
    setSuccess(false);
    const loadingId = hubNotify.loading('Sending KAS…', 'Confirm in your wallet');

    try {
      const amountNum = parseFloat(amount);
      const sompiAmount = kasToSompis(amountNum);

      const result = await sendKaspaTransaction(state.provider, {
        to: toAddress.trim(),
        amount: sompiAmount.toString(),
      });

      if (result.status === 'failed') {
        throw new Error(result.error || 'Transaction failed');
      }

      setSuccess(true);
      if (sendKasDApp && state.address && result.txHash) {
        awardDAppHubPoints({
          walletRaw: state.address,
          dapp: sendKasDApp,
          actionId: 'send-kas',
          txHash: result.txHash,
          krexTier: tier,
          krexBalance: krexBalance ?? 0,
          baseSpendKas: amountNum,
        });
      }
      setToAddress('');
      setAmount('');
      await refreshBalance();

      if (result.txHash) {
        hubNotify.txSuccess({
          id: loadingId,
          title: 'KAS sent',
          description: `${amountNum} KAS submitted`,
          txHash: result.txHash,
        });
      } else {
        hubNotify.update(loadingId, {
          title: 'KAS sent',
          description: 'Transaction submitted',
          variant: 'success',
        });
      }
    } catch (err) {
      hubNotify.update(loadingId, {
        title: 'Send failed',
        description: err instanceof Error ? err.message : 'Failed to send transaction',
        variant: 'error',
      });
      console.error('Send KAS error:', err);
    } finally {
      setIsSending(false);
    }
  };

  const railActions = state.isConnected ? (
    <button
      type="button"
      onClick={handleSend}
      disabled={isSending || !toAddress.trim() || !amount || parseFloat(amount) <= 0}
      className="w-full k-control-btn !border-[#02abb8] !bg-[#02abb8] !text-white hover:!bg-[#028a94] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isSending ? 'Sending...' : 'Send KAS'}
    </button>
  ) : null;

  useRegisterDAppWidgetRailSlot('actions', railActions, [state.isConnected, isSending, toAddress, amount]);
  useRegisterHubFlowProgress('hubPay', { busy: isSending, complete: Boolean(success) }, [isSending, success]);

  return (
    <DAppWidgetShell
      title="Interact"
      heading="Send KAS"
      description="Send native KAS on Kaspa L1. Network fees apply separately from the amount you enter."
    >
      {!state.isConnected ? (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-center dark:border-zinc-700 dark:bg-zinc-950">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Connect KasWare or Kastle from the site header to send KAS.
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-zinc-500 dark:text-zinc-400">Connected address</span>
              <span className="font-mono text-zinc-900 dark:text-zinc-100">
                {state.address ? `${state.address.slice(0, 8)}...${state.address.slice(-8)}` : 'N/A'}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3 text-sm">
              <span className="text-zinc-500 dark:text-zinc-400">KAS balance</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {isBalanceLoading ? 'Loading...' : `${kasBalance || '0.00'} KAS`}
              </span>
            </div>
          </div>

          <div className="k-form-group !mb-0">
            <KxFormFieldLabel tooltip="Valid Kaspa address starting with kaspa:">
              Recipient address
            </KxFormFieldLabel>
            <input
              id="toAddress"
              type="text"
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              placeholder="kaspa:..."
              className="k-input text-base"
              disabled={isSending}
            />
          </div>

          <div className="k-form-group !mb-0">
            <KxFormFieldLabel tooltip="Amount of KAS to send, excluding network fees.">
              Amount (KAS)
            </KxFormFieldLabel>
            <input
              id="amount"
              type="number"
              step="0.00000001"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="k-input text-base"
              disabled={isSending}
            />
          </div>
        </>
      )}
    </DAppWidgetShell>
  );
}
