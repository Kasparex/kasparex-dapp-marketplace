'use client';

import { useState, useEffect } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { queryL1KREXBalance } from '@/lib/krex/l1-balance';
import { signKrc20Transfer } from '@/lib/kaspa/l1WalletActions';
import { isValidKaspaAddress } from '@/lib/kaspa/sdk';
import { Alert } from '@/components/Alert';
import { getExplorerTxUrl, getKaspaExplorerAddressUrl } from '@/lib/store/utils';
import { CopyableAddress } from '@/components/donations/CopyableAddress';

export function SendKREXWidget() {
  const { state } = useKaspaWallet();
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [krexBalance, setKrexBalance] = useState<number>(0);
  const [krexDecimals, setKrexDecimals] = useState<number>(8); // Default to 8 decimals for KRC-20
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [sentAmount, setSentAmount] = useState<string | null>(null);
  const [txHashCopied, setTxHashCopied] = useState(false);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // Fetch KREX balance when connected (Kasplex indexer; works for KasWare and Kastle)
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
    if (state.provider !== 'kasware' && state.provider !== 'kastle') {
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
      // Convert amount from whole tokens to smallest unit (multiply by 10^decimals)
      // KRC-20 transfers require amount in smallest unit, not whole tokens
      // Example: 10000 KREX with 8 decimals = 10000 * 10^8 = 1000000000000
      const amountInSmallestUnit = Math.floor(amountNum * Math.pow(10, krexDecimals));

      // Ensure recipient address is properly formatted (keep kaspa: prefix as per KasWare API)
      const recipientAddress = toAddress.trim();

      // Create transfer inscription JSON for KRC-20 transfer
      // According to KasWare API documentation, the JSON should include the 'to' field
      // Note: 'amt' must be in smallest unit (like satoshis), not whole tokens
      // Protocol field should be uppercase "KRC-20" per KasWare API specification
      const inscribeJson = {
        p: 'KRC-20', // Uppercase as per KasWare API spec
        op: 'transfer',
        tick: 'KREX',
        amt: amountInSmallestUnit.toString(), // Amount in smallest unit
        to: recipientAddress, // Include recipient address in JSON (per KasWare API example)
      };

      // Stringify the JSON and verify it's actually a string
      const inscribeJsonString = JSON.stringify(inscribeJson);

      // Validate the string was created correctly
      if (typeof inscribeJsonString !== 'string' || inscribeJsonString === 'null' || inscribeJsonString === 'undefined') {
        throw new Error('Failed to create valid JSON string for KRC-20 transfer');
      }

      console.log('[SendKREX] Prepared inscription JSON:', {
        json: inscribeJson,
        string: inscribeJsonString,
        stringType: typeof inscribeJsonString,
        stringLength: inscribeJsonString.length,
      });

      // Type: 2=deploy, 3=mint, 4=transfer (as number per KasWare API)
      // Priority fee: 0.001 KAS to ensure transaction is processed (in KAS units)
      // Note: The wallet will automatically calculate the base network fee for the KRC-20 transfer
      const priorityFeeKAS = 0.001;
      const txHash = await signKrc20Transfer(
        state.provider,
        inscribeJsonString,
        4, // Transfer type as number (4 = transfer)
        recipientAddress,
        priorityFeeKAS
      );

      setTxHash(txHash);
      setSuccess(true);
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

      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess(false);
        setTxHash(null);
        setSentTo(null);
        setSentAmount(null);
      }, 5000);
    } catch (err) {
      // Enhanced error logging to help diagnose issues
      console.error('Send KREX error:', err);
      console.error('Error details:', {
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
        name: err instanceof Error ? err.name : undefined,
        fullError: err,
      });

      // Extract more detailed error message
      let errorMessage = 'Failed to send KREX';
      if (err instanceof Error) {
        errorMessage = err.message || errorMessage;
        // Check for common error patterns
        if (err.message.includes('user rejected') || err.message.includes('rejected')) {
          errorMessage = 'Transaction was rejected';
        } else if (err.message.includes('insufficient') || err.message.includes('balance')) {
          errorMessage = 'Insufficient balance for transaction';
        } else if (err.message.includes('not connected') || err.message.includes('disconnected')) {
          errorMessage = 'Wallet is not connected. Please reconnect your wallet.';
        } else if (err.message.includes('invalid') || err.message.includes('Invalid')) {
          errorMessage = `Invalid transaction: ${err.message}`;
        } else if (err.message) {
          errorMessage = err.message;
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

  if (!state.isConnected) {
    return (
      <div className="p-6 space-y-4">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Connect <strong>KasWare</strong> or <strong>Kastle</strong> from the site header to send KREX.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
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
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="amount" className="k-label !mb-0 truncate">
            Amount (KREX)
          </label>
          <div className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 dark:text-zinc-500">
            Balance:{' '}
            {isLoadingBalance
              ? 'Loading…'
              : krexBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
          </div>
        </div>
        <div className="flex gap-2">
          <input
            id="amount"
            type="number"
            step="0.00000001"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="k-input flex-1"
            disabled={isSending}
          />
          <button
            type="button"
            onClick={handleMaxAmount}
            className="px-4 py-2 text-sm font-medium text-white dark:text-zinc-300 bg-zinc-700 dark:bg-zinc-700 hover:bg-zinc-600 dark:hover:bg-zinc-600 rounded-lg transition-colors"
            disabled={isSending || krexBalance <= 0}
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
            <CopyableAddress label="Sent to" value={sentTo} explorerUrl={getKaspaExplorerAddressUrl(sentTo)} truncate={true} />
          ) : null}
          {sentAmount ? (
            <div className="text-xs text-zinc-600 dark:text-zinc-400">
              Amount: <span className="font-semibold text-zinc-900 dark:text-zinc-100">{sentAmount}</span> KREX
            </div>
          ) : null}
        </div>
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
