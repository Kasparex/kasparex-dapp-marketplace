'use client';

import { useState, useEffect } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { sendKaspaTransaction } from '@/lib/kaspa/wallet';
import { kasToSompis, sompisToKas } from '@/lib/kaspa/api';
import { isValidKaspaAddress } from '@/lib/kaspa/sdk';
import { Alert } from '@/components/Alert';
import { useKaspaBalance } from '@/hooks/useKaspaBalance';

export function SendKASWidget() {
  const { state, connect } = useKaspaWallet();
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
      <div className="p-6 space-y-4">
        <button
          onClick={() => connect('kasware')}
          className="w-full px-4 py-3 bg-[#02abb8] hover:bg-[#028a94] text-white rounded-lg font-medium transition-colors"
        >
          Connect Kaspa Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {/* Wallet Info */}
      <div className="bg-zinc-800 dark:bg-zinc-800/50 rounded-lg p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">Connected Address:</span>
          <span className="text-sm font-mono text-zinc-900 dark:text-zinc-100">
            {state.address ? `${state.address.slice(0, 8)}...${state.address.slice(-8)}` : 'N/A'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">KAS Balance:</span>
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {isBalanceLoading ? 'Loading...' : kasBalance || '0.00'} KAS
          </span>
        </div>
      </div>

      {/* Recipient Address */}
      <div>
        <label htmlFor="toAddress" className="k-label">
          Recipient Address
        </label>
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

      {/* Amount */}
      <div>
        <label htmlFor="amount" className="k-label">
          Amount (KAS)
        </label>
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
            className="px-4 py-2 text-sm font-medium text-white dark:text-zinc-300 bg-zinc-700 dark:bg-zinc-700 hover:bg-zinc-600 dark:hover:bg-zinc-600 rounded-lg transition-colors"
            disabled={isSending || isBalanceLoading || !balanceInKas || balanceInKas <= 0}
          >
            Max
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Alert type="error" compact onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Success Message */}
      {success && txHash && (
        <Alert type="success" compact>
          Transaction sent successfully! Hash: {txHash.slice(0, 16)}...
        </Alert>
      )}

      {/* Send Button */}
      <button
        onClick={handleSend}
        disabled={isSending || !toAddress.trim() || !amount || parseFloat(amount) <= 0}
        className="w-full px-4 py-3 bg-[#02abb8] hover:bg-[#028a94] text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSending ? 'Sending...' : 'Send KAS'}
      </button>
    </div>
  );
}
