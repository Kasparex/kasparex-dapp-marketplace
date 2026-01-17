'use client';

import { useState, useEffect } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { signKRC20Transaction, getKRC20Balance } from '@/lib/kaspa/kasware';
import { isValidKaspaAddress } from '@/lib/kaspa/sdk';
import { Alert } from '@/components/Alert';
import { NetworkInfoMessage } from '@/components/NetworkInfoMessage';

export function SendKREXWidget() {
  const { state, connect } = useKaspaWallet();
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [krexBalance, setKrexBalance] = useState<string | number | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // Fetch KREX balance when connected
  useEffect(() => {
    const fetchBalance = async () => {
      if (state.isConnected && state.provider === 'kasware') {
        setIsLoadingBalance(true);
        try {
          const tokens = await getKRC20Balance();
          const krexToken = tokens.find((token) => token.tick?.toUpperCase() === 'KREX');
          if (krexToken) {
            setKrexBalance(krexToken.amount);
          } else {
            setKrexBalance('0');
          }
        } catch (err) {
          console.error('Error fetching KREX balance:', err);
          setKrexBalance(null);
        } finally {
          setIsLoadingBalance(false);
        }
      } else {
        setKrexBalance(null);
      }
    };

    fetchBalance();
  }, [state.isConnected, state.provider]);

  const handleSend = async () => {
    if (!state.isConnected || state.provider !== 'kasware') {
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

    const amountNum = parseFloat(amount);
    const balanceNum = typeof krexBalance === 'string' ? parseFloat(krexBalance) : (krexBalance || 0);
    
    if (amountNum > balanceNum) {
      setError('Insufficient KREX balance');
      return;
    }

    setIsSending(true);
    setError(null);
    setSuccess(false);
    setTxHash(null);

    try {
      // Create transfer inscription JSON for KRC-20 transfer
      const inscribeJson = {
        p: 'krc-20',
        op: 'transfer',
        tick: 'KREX',
        amt: amountNum.toString(),
      };

      const inscribeJsonString = JSON.stringify(inscribeJson);
      const txHash = await signKRC20Transaction(
        inscribeJsonString,
        'transfer',
        toAddress.trim()
      );

      setTxHash(txHash);
      setSuccess(true);
      setToAddress('');
      setAmount('');

      // Refresh balance
      const tokens = await getKRC20Balance();
      const krexToken = tokens.find((token) => token.tick?.toUpperCase() === 'KREX');
      if (krexToken) {
        setKrexBalance(krexToken.amount);
      }

      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess(false);
        setTxHash(null);
      }, 5000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send KREX';
      setError(errorMessage);
      console.error('Send KREX error:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleMaxAmount = () => {
    if (krexBalance) {
      const balanceNum = typeof krexBalance === 'string' ? parseFloat(krexBalance) : krexBalance;
      setAmount(balanceNum.toString());
    }
  };

  if (!state.isConnected) {
    return (
      <div className="p-6 space-y-4">
        <NetworkInfoMessage 
          networkType="L1"
          message="This dApp runs on L1 (Kaspa network). Please connect your Kaspa wallet to send KREX."
        />
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
      <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-lg p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">Connected Address:</span>
          <span className="text-sm font-mono text-zinc-900 dark:text-zinc-100">
            {state.address ? `${state.address.slice(0, 8)}...${state.address.slice(-8)}` : 'N/A'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">KREX Balance:</span>
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {isLoadingBalance ? 'Loading...' : krexBalance !== null ? krexBalance.toString() : 'N/A'}
          </span>
        </div>
      </div>

      {/* Recipient Address */}
      <div>
        <label htmlFor="toAddress" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          Recipient Address
        </label>
        <input
          id="toAddress"
          type="text"
          value={toAddress}
          onChange={(e) => setToAddress(e.target.value)}
          placeholder="kaspa:..."
          className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8]"
          disabled={isSending}
        />
      </div>

      {/* Amount */}
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          Amount (KREX)
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
            className="flex-1 px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8]"
            disabled={isSending}
          />
          <button
            type="button"
            onClick={handleMaxAmount}
            className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
            disabled={isSending || !krexBalance}
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
        {isSending ? 'Sending...' : 'Send KREX'}
      </button>
    </div>
  );
}
