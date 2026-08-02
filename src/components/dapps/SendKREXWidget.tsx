'use client';

import { useState, useEffect } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { queryL1KREXBalance } from '@/lib/krex/l1-balance';
import { signKrc20Transfer } from '@/lib/kaspa/l1WalletActions';
import { isValidKaspaAddress } from '@/lib/kaspa/sdk';
import { KxFormFieldLabel } from '@/components/ui/KxFormFieldLabel';
import { DAppWidgetShell } from '@/components/dapps/DAppWidgetShell';
import { useRegisterDAppWidgetRailSlot } from '@/lib/dapps/DAppWidgetActionRailContext';
import { useRegisterHubFlowProgress } from '@/hooks/useRegisterHubFlowProgress';
import { useSyncDAppWidgetQuote } from '@/lib/dapps/PaymentAmountContext';
import { placeholderDApps } from '@/lib/dapps';
import { awardDAppHubPoints } from '@/lib/rewards/awardDAppHubPoints';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { hubNotify } from '@/lib/hub/notify';

export function SendKREXWidget() {
  const { state } = useKaspaWallet();
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [krexBalance, setKrexBalance] = useState<number>(0);
  const [krexDecimals] = useState<number>(8);
  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  const { tier, balance: krexBal } = useKREXBalance();
  const sendKrexDApp = placeholderDApps.find((d) => d.slug === 'send-krex');
  const parsedAmount = amount && !Number.isNaN(parseFloat(amount)) ? parseFloat(amount) : null;
  useSyncDAppWidgetQuote(parsedAmount, 'send-krex');

  useEffect(() => {
    const fetchBalance = async () => {
      if (state.isConnected && state.address) {
        setIsLoadingBalance(true);
        try {
          const bal = await queryL1KREXBalance(state.address);
          setKrexBalance(bal);
        } catch (err) {
          console.error('Error fetching KREX balance:', err);
          setKrexBalance(0);
        } finally {
          setIsLoadingBalance(false);
        }
      } else {
        setKrexBalance(0);
      }
    };

    void fetchBalance();
  }, [state.isConnected, state.address]);

  const handleSend = async () => {
    if (!state.isConnected || !state.provider) {
      hubNotify.error('Wallet required', 'Please connect your Kaspa wallet first');
      return;
    }
    if (state.provider !== 'kasware' && state.provider !== 'kastle' && state.provider !== 'kaspire') {
      hubNotify.warning('Wallet unsupported', 'KREX send requires KasWare, Kastle, or Kaspire');
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

    const amountNum = parseFloat(amount);

    if (amountNum > krexBalance) {
      hubNotify.error('Insufficient balance', 'Not enough KREX for this transfer');
      return;
    }

    setIsSending(true);
    setSuccess(false);
    const loadingId = hubNotify.loading('Sending KREX…', 'Confirm in your wallet');

    try {
      const amountInSmallestUnit = Math.floor(amountNum * Math.pow(10, krexDecimals));
      const recipientAddress = toAddress.trim();
      const inscribeJson = {
        p: 'KRC-20',
        op: 'transfer',
        tick: 'KREX',
        amt: amountInSmallestUnit.toString(),
        to: recipientAddress,
      };
      const inscribeJsonString = JSON.stringify(inscribeJson);

      if (typeof inscribeJsonString !== 'string' || inscribeJsonString === 'null' || inscribeJsonString === 'undefined') {
        throw new Error('Failed to create valid JSON string for KRC-20 transfer');
      }

      const priorityFeeKAS = 0.001;
      const hash = await signKrc20Transfer(
        state.provider,
        inscribeJsonString,
        4,
        recipientAddress,
        priorityFeeKAS,
      );

      setSuccess(true);
      if (sendKrexDApp && state.address) {
        awardDAppHubPoints({
          walletRaw: state.address,
          dapp: sendKrexDApp,
          actionId: 'send-krex',
          txHash: hash,
          krexTier: tier,
          krexBalance: krexBal ?? 0,
          baseSpendKas: amountNum,
        });
      }
      setToAddress('');
      setAmount('');

      if (state.address) {
        try {
          const bal = await queryL1KREXBalance(state.address);
          setKrexBalance(bal);
        } catch (err) {
          console.error('Error refreshing balance:', err);
        }
      }

      hubNotify.txSuccess({
        id: loadingId,
        title: 'KREX sent',
        description: `${amountNum} KREX to ${recipientAddress.slice(0, 12)}…`,
        txHash: hash,
      });
    } catch (err) {
      let errorMessage = 'Failed to send KREX';
      if (err instanceof Error) {
        errorMessage = err.message || errorMessage;
        if (err.message.includes('user rejected') || err.message.includes('rejected')) {
          errorMessage = 'Transaction was rejected';
        } else if (err.message.includes('insufficient') || err.message.includes('balance')) {
          errorMessage = 'Insufficient balance for transaction';
        } else if (err.message.includes('not connected') || err.message.includes('disconnected')) {
          errorMessage = 'Wallet is not connected. Please reconnect your wallet.';
        }
      } else if (typeof err === 'string') {
        errorMessage = err;
      }

      hubNotify.update(loadingId, {
        title: 'Send failed',
        description: errorMessage,
        variant: 'error',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleMaxAmount = () => {
    if (krexBalance > 0) {
      setAmount(krexBalance.toString());
    }
  };

  const railActions = state.isConnected ? (
    <button
      type="button"
      onClick={handleSend}
      disabled={isSending || !toAddress.trim() || !amount || parseFloat(amount) <= 0}
      className="w-full k-control-btn !border-[#02abb8] !bg-[#02abb8] !text-white hover:!bg-[#028a94] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isSending ? 'Sending...' : 'Send KREX'}
    </button>
  ) : null;

  useRegisterDAppWidgetRailSlot('actions', railActions, [state.isConnected, isSending, toAddress, amount]);
  useRegisterHubFlowProgress('hubPay', { busy: isSending, complete: Boolean(success) }, [isSending, success]);

  return (
    <DAppWidgetShell
      title="Interact"
      heading="Send KREX"
      description="Send KRC-20 KREX on Kaspa L1. Network fees apply separately from the KREX amount."
    >
      {!state.isConnected ? (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-center dark:border-zinc-700 dark:bg-zinc-950">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Connect KasWare or Kastle from the site header to send KREX.
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-zinc-500 dark:text-zinc-400">KREX balance</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {isLoadingBalance
                  ? 'Loading...'
                  : krexBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
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
            <div className="mb-2 flex items-center justify-between gap-2">
              <KxFormFieldLabel className="!mb-0" tooltip="Amount of KREX to transfer.">
                Amount (KREX)
              </KxFormFieldLabel>
              <button
                type="button"
                onClick={handleMaxAmount}
                className="text-xs font-semibold uppercase tracking-wide text-[#02abb8] hover:underline disabled:opacity-50"
                disabled={isSending || krexBalance <= 0}
              >
                Max
              </button>
            </div>
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
