'use client';

import { useState, useEffect } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { sendKaspaTransaction } from '@/lib/kaspa/wallet';
import { kasToSompis, sompisToKas } from '@/lib/kaspa/api';
import { isValidKaspaAddress } from '@/lib/kaspa/sdk';
import { Alert } from '@/components/Alert';
import { KxAlertRegion } from '@/components/ui/KxAlertRegion';
import { KxFormFieldLabel } from '@/components/ui/KxFormFieldLabel';
import { KX_BTN_PRIMARY } from '@/lib/hub/shellTokens';
import { useKaspaBalance } from '@/hooks/useKaspaBalance';

export function SendKASWidget() {
  const { state } = useKaspaWallet();
  const { balance: kasBalance, balanceInKas, isLoading: isBalanceLoading, refresh: refreshBalance } = useKaspaBalance();
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const handleSend = async () => {
    if (!state.isConnected || !state.provider) {
      setError('Please connect your Kaspa wallet first');
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

    setIsSending(true);
    setError(null);
    setSuccess(false);
    setTxHash(null);

    try {
      const amountNum = parseFloat(amount);
      const sompiAmount = kasToSompis(amountNum);

      const transaction = {
        to: toAddress.trim(),
        amount: sompiAmount.toString(),
      };

      const result = await sendKaspaTransaction(state.provider, transaction);

      if (result.status === 'failed') {
        throw new Error(result.error || 'Transaction failed');
      }

      setTxHash(result.txHash);
      setSuccess(true);
      setToAddress('');
      setAmount('');

      // Refresh balance after successful transaction
      await refreshBalance();

      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess(false);
        setTxHash(null);
      }, 5000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send transaction';
      setError(errorMessage);
      console.error('Send KAS error:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleMaxAmount = () => {
    // For now, we can't get balance easily, so we'll skip this
    // In a real implementation, you'd fetch balance and set max amount
  };

  if (!state.isConnected) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-center dark:border-zinc-700 dark:bg-zinc-950">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Connect KasWare or Kastle from the site header to send KAS.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-2 dark:border-zinc-700 dark:bg-zinc-950">
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-500 dark:text-zinc-400">Connected address</span>
          <span className="font-mono text-zinc-900 dark:text-zinc-100">
            {state.address ? `${state.address.slice(0, 8)}...${state.address.slice(-8)}` : 'N/A'}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-500 dark:text-zinc-400">KAS balance</span>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {isBalanceLoading ? 'Loading...' : kasBalance || '0.00'} KAS
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
          className="k-input"
          disabled={isSending}
        />
      </div>

      <div className="k-form-group !mb-0">
        <KxFormFieldLabel tooltip="Amount of KAS to send, excluding network fees.">
          Amount (KAS)
        </KxFormFieldLabel>
        <div className="flex gap-2">
          <input
            id="amount"
            type="number"
            step="0.00000001"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="k-input"
            disabled={isSending}
          />
          <button
            type="button"
            onClick={handleMaxAmount}
            className="k-control-btn shrink-0"
            disabled={isSending || isBalanceLoading || !balanceInKas || balanceInKas <= 0}
          >
            Max
          </button>
        </div>
      </div>

      <KxAlertRegion>
        {error ? (
          <Alert type="error" compact region onDismiss={() => setError(null)}>
            {error}
          </Alert>
        ) : null}
        {success && txHash ? (
          <Alert type="success" compact region>
            Transaction sent. Hash: {txHash.slice(0, 16)}...
          </Alert>
        ) : null}
      </KxAlertRegion>

      <button
        onClick={handleSend}
        disabled={isSending || !toAddress.trim() || !amount || parseFloat(amount) <= 0}
        className={KX_BTN_PRIMARY}
      >
        {isSending ? 'Sending...' : 'Send KAS'}
      </button>
    </div>
  );
}
