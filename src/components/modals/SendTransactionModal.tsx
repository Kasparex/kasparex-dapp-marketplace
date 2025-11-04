'use client';

import { useState, useEffect } from 'react';
import { sendKaspa } from '@/lib/kaspa/kasware';
import { kasToSompis } from '@/lib/kaspa/api';

interface SendTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: string | null;
  address: string | null;
}

export function SendTransactionModal({ isOpen, onClose, currentBalance, address }: SendTransactionModalProps) {
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [priorityFee, setPriorityFee] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setToAddress('');
      setAmount('');
      setPriorityFee('');
      setError(null);
      setTxHash(null);
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!toAddress.trim()) {
      setError('Please enter a recipient address');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    const balanceNum = currentBalance ? parseFloat(currentBalance) : 0;
    const amountNum = parseFloat(amount);
    
    if (amountNum > balanceNum) {
      setError('Insufficient balance');
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      const sompiAmount = kasToSompis(amountNum);
      const options: Record<string, any> = {};
      
      if (priorityFee) {
        options.priorityFee = parseFloat(priorityFee);
      }

      const hash = await sendKaspa(toAddress.trim(), sompiAmount, options);
      setTxHash(hash);
      
      // Reset form after successful send
      setTimeout(() => {
        setToAddress('');
        setAmount('');
        setPriorityFee('');
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send transaction';
      setError(errorMessage);
      console.error('Send transaction error:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleMaxAmount = () => {
    if (currentBalance) {
      const balanceNum = parseFloat(currentBalance);
      // Reserve some for fees (0.001 KAS)
      const maxAmount = Math.max(0, balanceNum - 0.001);
      setAmount(maxAmount.toFixed(8));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-full max-w-md mx-4 border border-zinc-200 dark:border-zinc-800">
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              Send KAS
            </h2>
            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-6 py-4 space-y-4">
          {txHash ? (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-semibold">Transaction Sent Successfully!</span>
                </div>
                <div className="text-sm text-zinc-700 dark:text-zinc-300">
                  <div className="font-mono break-all">{txHash}</div>
                  <a
                    href={`https://explorer.kaspa.org/txs/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block"
                  >
                    View on Explorer →
                  </a>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-full px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Recipient Address
                </label>
                <input
                  type="text"
                  value={toAddress}
                  onChange={(e) => setToAddress(e.target.value)}
                  placeholder="kaspa:..."
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isSending}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Amount (KAS)
                  </label>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    Balance: {currentBalance || '0.00'} KAS
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.00000001"
                    min="0"
                    className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isSending}
                  />
                  <button
                    type="button"
                    onClick={handleMaxAmount}
                    className="px-3 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    disabled={isSending || !currentBalance}
                  >
                    Max
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Priority Fee (Optional)
                </label>
                <input
                  type="number"
                  value={priorityFee}
                  onChange={(e) => setPriorityFee(e.target.value)}
                  placeholder="0"
                  step="1"
                  min="0"
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isSending}
                />
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Higher fees may result in faster confirmation
                </p>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  disabled={isSending}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  disabled={isSending || !toAddress.trim() || !amount}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {isSending ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Sending...
                    </>
                  ) : (
                    'Send'
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

