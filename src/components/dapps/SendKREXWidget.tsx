'use client';

import { useState, useEffect } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { queryL1KREXBalance } from '@/lib/krex/l1-balance';
import { signKrc20Transfer } from '@/lib/kaspa/l1WalletActions';
import { isValidKaspaAddress } from '@/lib/kaspa/sdk';
import { Alert } from '@/components/Alert';
import { KxAlertRegion } from '@/components/ui/KxAlertRegion';
import { KxFormFieldLabel } from '@/components/ui/KxFormFieldLabel';
import { getExplorerTxUrl, getKaspaExplorerAddressUrl } from '@/lib/store/utils';
import { CopyableAddress } from '@/components/donations/CopyableAddress';
import { DAppWidgetShell } from '@/components/dapps/DAppWidgetShell';
import { useRegisterDAppWidgetRailSlot } from '@/lib/dapps/DAppWidgetActionRailContext';
import { useRegisterHubFlowProgress } from '@/hooks/useRegisterHubFlowProgress';
import { useSyncDAppWidgetQuote } from '@/lib/dapps/PaymentAmountContext';
import { placeholderDApps } from '@/lib/dapps';
import { awardDAppHubPoints } from '@/lib/rewards/awardDAppHubPoints';
import { useKREXBalance } from '@/hooks/useKREXBalance';

export function SendKREXWidget() {
  const { state } = useKaspaWallet();
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [krexBalance, setKrexBalance] = useState<number>(0);
  const [krexDecimals] = useState<number>(8);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [sentAmount, setSentAmount] = useState<string | null>(null);
  const [txHashCopied, setTxHashCopied] = useState(false);
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
      setError('Please connect your Kaspa wallet first');
      return;
    }
    if (state.provider !== 'kasware' && state.provider !== 'kastle' && state.provider !== 'kaspire') {
      setError('KREX send requires KasWare or Kastle');
      return;
    }

    if (!toAddress.trim()) {
      setError('Please enter a recipient address');
      return;
    }

    if (!isValidKaspaAddress(toAddress.trim())) {
      setError('Please enter a valid Kaspa address');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    const amountNum = parseFloat(amount);

    if (amountNum > krexBalance) {
      setError('Insufficient KREX balance');
      return;
    }

    setIsSending(true);
    setError(null);
    setSuccess(false);
    setTxHash(null);

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

      setTxHash(hash);
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
      setSentTo(recipientAddress);
      setSentAmount(amountNum.toString());
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

      setTimeout(() => {
        setSuccess(false);
        setTxHash(null);
        setSentTo(null);
        setSentAmount(null);
      }, 5000);
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

      setError(errorMessage);
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

  const railAlerts =
    error || (success && txHash) ? (
      <KxAlertRegion>
        {error ? (
          <Alert type="error" compact region onDismiss={() => setError(null)}>
            {error}
          </Alert>
        ) : null}
        {success && txHash ? (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold">KREX transfer submitted</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-zinc-700 dark:text-zinc-300 break-all">{txHash}</span>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(txHash);
                      setTxHashCopied(true);
                      setTimeout(() => setTxHashCopied(false), 2000);
                    } catch {}
                  }}
                  className="p-1.5 rounded border border-zinc-300 dark:border-zinc-600 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  title="Copy tx hash"
                >
                  {txHashCopied ? (
                    <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
                <a
                  href={getExplorerTxUrl(txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded border border-zinc-300 dark:border-zinc-600 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  title="View in Explorer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
            {sentTo ? (
              <CopyableAddress label="Sent to" value={sentTo} explorerUrl={getKaspaExplorerAddressUrl(sentTo)} truncate />
            ) : null}
            {sentAmount ? (
              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                Amount: <span className="font-semibold text-zinc-900 dark:text-zinc-100">{sentAmount}</span> KREX
              </div>
            ) : null}
          </div>
        ) : null}
      </KxAlertRegion>
    ) : null;

  useRegisterDAppWidgetRailSlot('actions', railActions, [state.isConnected, isSending, toAddress, amount]);
  useRegisterDAppWidgetRailSlot('alerts', railAlerts, [error, success, txHash, sentTo, sentAmount, txHashCopied]);
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
