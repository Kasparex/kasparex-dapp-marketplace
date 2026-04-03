'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { createKRC20Order, buyKRC20Token, cancelKRC20Order } from '@/lib/kaspa/kasware';
import { kasToSompis } from '@/lib/kaspa/api';
import { getErrorMessage } from '@/lib/utils';
import { getExplorerTxUrl, extractTxId } from '@/lib/store/utils';

interface KRC20OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'buy' | 'cancel';
  currentBalance?: string | null;
  krc20Tokens?: Array<{ tick: string; amount: string | number; [key: string]: any }>;
}

export function KRC20OrderModal({ isOpen, onClose, mode, currentBalance, krc20Tokens = [] }: KRC20OrderModalProps) {
  const { state: kaspaState } = useKaspaWallet();
  const [krc20Tick, setKrc20Tick] = useState('');
  const [krc20Amount, setKrc20Amount] = useState('');
  const [kasAmount, setKasAmount] = useState('');
  const [priorityFee, setPriorityFee] = useState('');
  const [txJsonString, setTxJsonString] = useState('');
  const [sendCommitTxId, setSendCommitTxId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setKrc20Tick('');
      setKrc20Amount('');
      setKasAmount('');
      setPriorityFee('');
      setTxJsonString('');
      setSendCommitTxId('');
      setError(null);
      setTxHash(null);
    }
  }, [isOpen, mode]);

  const handleCreateOrder = async () => {
    if (!krc20Tick.trim()) {
      setError('Please enter a KRC-20 ticker');
      return;
    }
    if (!krc20Amount || parseFloat(krc20Amount) <= 0) {
      setError('Please enter a valid KRC-20 amount');
      return;
    }
    if (!kasAmount || parseFloat(kasAmount) <= 0) {
      setError('Please enter a valid KAS amount');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const hash = await createKRC20Order({
        krc20Tick: krc20Tick.trim().toUpperCase(),
        krc20Amount: parseFloat(krc20Amount),
        kasAmount: kasToSompis(parseFloat(kasAmount)),
        priorityFee: priorityFee ? parseFloat(priorityFee) : undefined,
      });
      setTxHash(hash);
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Failed to create order');
      setError(errorMessage);
      console.error('Create order error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBuyToken = async () => {
    if (!txJsonString.trim()) {
      setError('Please enter transaction JSON string');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const hash = await buyKRC20Token({
        txJsonString: txJsonString.trim(),
        priorityFee: priorityFee ? parseFloat(priorityFee) : undefined,
      });
      setTxHash(hash);
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Failed to buy token');
      setError(errorMessage);
      console.error('Buy token error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!krc20Tick.trim()) {
      setError('Please enter a KRC-20 ticker');
      return;
    }
    if (!txJsonString.trim()) {
      setError('Please enter transaction JSON string');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const hash = await cancelKRC20Order({
        krc20Tick: krc20Tick.trim().toUpperCase(),
        txJsonString: txJsonString.trim(),
        sendCommitTxId: sendCommitTxId || undefined,
      });
      setTxHash(hash);
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Failed to cancel order');
      setError(errorMessage);
      console.error('Cancel order error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const orderBookBlocked = kaspaState.provider === 'kastle';

  const handleSubmit = () => {
    if (orderBookBlocked) return;
    if (mode === 'create') {
      handleCreateOrder();
    } else if (mode === 'buy') {
      handleBuyToken();
    } else if (mode === 'cancel') {
      handleCancelOrder();
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'create':
        return 'Create KRC-20 Order';
      case 'buy':
        return 'Buy KRC-20 Token';
      case 'cancel':
        return 'Cancel KRC-20 Order';
      default:
        return 'KRC-20 Order';
    }
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <>
      <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[9999] bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-[calc(100vw-2rem)] sm:w-full max-w-md border border-zinc-200 dark:border-zinc-800 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              {getTitle()}
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
                  <span className="font-semibold">Transaction Successful!</span>
                </div>
                <div className="text-sm text-zinc-700 dark:text-zinc-300">
                  <div className="font-mono break-all text-xs mb-2">{extractTxId(txHash)}</div>
                  <a
                    href={getExplorerTxUrl(txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#02abb8] hover:text-[#028a94] hover:underline mt-2 inline-flex items-center gap-2 font-medium"
                  >
                    View Transaction on Explorer
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
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
              {orderBookBlocked && (
                <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-sm text-amber-900 dark:text-amber-200">
                  KasWare-only: KRC-20 order book actions are not available when using Kastle. Connect with KasWare to create, buy, or cancel orders.
                </div>
              )}
              {mode === 'create' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      KRC-20 Ticker
                    </label>
                    <input
                      type="text"
                      value={krc20Tick}
                      onChange={(e) => setKrc20Tick(e.target.value)}
                      placeholder="KASPA"
                      className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                      disabled={isProcessing || orderBookBlocked}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      KRC-20 Amount
                    </label>
                    <input
                      type="number"
                      value={krc20Amount}
                      onChange={(e) => setKrc20Amount(e.target.value)}
                      placeholder="1000"
                      step="0.00000001"
                      min="0"
                      className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isProcessing || orderBookBlocked}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      KAS Amount
                    </label>
                    <input
                      type="number"
                      value={kasAmount}
                      onChange={(e) => setKasAmount(e.target.value)}
                      placeholder="1.0"
                      step="0.00000001"
                      min="0"
                      className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isProcessing || orderBookBlocked}
                    />
                    {currentBalance && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        Balance: {currentBalance} KAS
                      </p>
                    )}
                  </div>
                </>
              )}

              {mode === 'buy' && (
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Transaction JSON String
                  </label>
                  <textarea
                    value={txJsonString}
                    onChange={(e) => setTxJsonString(e.target.value)}
                    placeholder='{"transaction": "..."}'
                    rows={6}
                    className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    disabled={isProcessing || orderBookBlocked}
                  />
                </div>
              )}

              {mode === 'cancel' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      KRC-20 Ticker
                    </label>
                    <input
                      type="text"
                      value={krc20Tick}
                      onChange={(e) => setKrc20Tick(e.target.value)}
                      placeholder="KASPA"
                      className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                      disabled={isProcessing || orderBookBlocked}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      Transaction JSON String
                    </label>
                    <textarea
                      value={txJsonString}
                      onChange={(e) => setTxJsonString(e.target.value)}
                      placeholder='{"transaction": "..."}'
                      rows={4}
                      className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                      disabled={isProcessing || orderBookBlocked}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      Commit Transaction ID (Optional)
                    </label>
                    <input
                      type="text"
                      value={sendCommitTxId}
                      onChange={(e) => setSendCommitTxId(e.target.value)}
                      placeholder=""
                      className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isProcessing || orderBookBlocked}
                    />
                  </div>
                </>
              )}

              {(mode === 'create' || mode === 'buy') && (
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
                    disabled={isProcessing || orderBookBlocked}
                  />
                </div>
              )}

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isProcessing || orderBookBlocked}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </>
                  ) : (
                    getTitle()
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}

