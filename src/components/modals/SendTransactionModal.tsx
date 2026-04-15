'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { sendKaspaTransaction } from '@/lib/kaspa/wallet';
import { kasToSompis } from '@/lib/kaspa/api';
import { getErrorMessage } from '@/lib/utils';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useBalanceVisibility, formatBalanceForDisplay } from '@/hooks/useBalanceVisibility';
import { TokenLogoImage } from '@/components/ui/TokenLogoImage';
import { getExplorerTxUrl, extractTxId } from '@/lib/store/utils';
import { getKaspaExplorerAddressUrl } from '@/lib/store/utils';
import { CopyableAddress } from '@/components/donations/CopyableAddress';

interface SendTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: string | null;
  address: string | null;
  /** When provided, pre-fill recipient (e.g. for vDonations L1 flow). */
  initialToAddress?: string;
  /** When provided, pre-fill amount (e.g. for vDonations L1 flow). */
  initialAmount?: string;
}

export function SendTransactionModal({ isOpen, onClose, currentBalance, address, initialToAddress, initialAmount }: SendTransactionModalProps) {
  const { state } = useKaspaWallet();
  const { isVisible: isBalanceVisible } = useBalanceVisibility();
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [priorityFee, setPriorityFee] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txHashCopied, setTxHashCopied] = useState(false);
  const [sentToAddress, setSentToAddress] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setToAddress('');
      setAmount('');
      setPriorityFee('');
      setError(null);
      setTxHash(null);
    } else if (initialToAddress !== undefined || initialAmount !== undefined) {
      if (initialToAddress !== undefined) setToAddress(initialToAddress);
      if (initialAmount !== undefined) setAmount(initialAmount);
    }
  }, [isOpen, initialToAddress, initialAmount]);

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
      if (!state.provider) {
        throw new Error('Wallet provider not available');
      }

      const sompiAmount = kasToSompis(amountNum);

      // Use SDK transaction function
      const transaction = {
        to: toAddress.trim(),
        amount: sompiAmount.toString(),
        ...(priorityFee && { fee: priorityFee }),
      };

      const result = await sendKaspaTransaction(state.provider, transaction);

      if (result.status === 'failed') {
        throw new Error(result.error || 'Transaction failed');
      }

      setTxHash(result.txHash);
      setSentToAddress(toAddress.trim());

      // Reset form after successful send
      setTimeout(() => {
        setToAddress('');
        setAmount('');
        setPriorityFee('');
      }, 2000);
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Failed to send transaction');
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
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-semibold">Transaction Sent Successfully!</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-zinc-700 dark:text-zinc-300 break-all">{extractTxId(txHash)}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={async () => { try { await navigator.clipboard.writeText(extractTxId(txHash)); setTxHashCopied(true); setTimeout(() => setTxHashCopied(false), 2000); } catch {} }}
                      className="p-1.5 rounded border border-zinc-300 dark:border-zinc-600 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                      title="Copy tx hash"
                    >
                      {txHashCopied ? <span className="text-emerald-500 text-xs">Copied</span> : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>}
                    </button>
                    <a href={getExplorerTxUrl(txHash)} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded border border-zinc-300 dark:border-zinc-600 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700" title="View in Explorer">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </a>
                  </div>
                </div>
                {sentToAddress && (
                  <CopyableAddress label="Sent to" value={sentToAddress} explorerUrl={getKaspaExplorerAddressUrl(sentToAddress)} truncate={true} />
                )}
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
                <label className="k-label">
                  Recipient Address
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={toAddress}
                    onChange={(e) => setToAddress(e.target.value)}
                    placeholder="kaspa:..."
                    className="k-input flex-1"
                    disabled={isSending}
                  />
                  <button
                    type="button"
                    disabled={isSending}
                    onClick={async () => {
                      setScanError(null);
                      try {
                        if (typeof window === 'undefined' || !(window as any).BarcodeDetector) {
                          throw new Error('QR scanning is not supported in this browser.');
                        }
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        (input as any).capture = 'environment';
                        input.onchange = async () => {
                          try {
                            const file = input.files?.[0];
                            if (!file) return;
                            const img = await createImageBitmap(file);
                            const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
                            const codes = await detector.detect(img);
                            const raw = codes?.[0]?.rawValue || '';
                            if (!raw) throw new Error('No QR code found.');
                            const trimmed = String(raw).trim();
                            const maybeAddress = trimmed.startsWith('kaspa:') ? trimmed : trimmed;
                            setToAddress(maybeAddress);
                          } catch (e: any) {
                            setScanError(e?.message || 'Failed to scan QR code.');
                          }
                        };
                        input.click();
                      } catch (e: any) {
                        setScanError(e?.message || 'Failed to start QR scan.');
                      }
                    }}
                    className="px-3 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors whitespace-nowrap"
                  >
                    Scan QR
                  </button>
                </div>
                {scanError ? (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">{scanError}</p>
                ) : null}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="k-label !mb-0 flex items-center gap-1.5 whitespace-nowrap">
                    Amount (<TokenLogoImage tokenId="kas" size={14} /> KAS)
                  </label>
                  <div className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 dark:text-zinc-500">
                    Balance: {formatBalanceForDisplay(currentBalance, 'KAS', false, isBalanceVisible)}
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
                    className="k-input flex-1"
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
                <label className="k-label">
                  Priority Fee (Optional)
                </label>
                <input
                  type="number"
                  value={priorityFee}
                  onChange={(e) => setPriorityFee(e.target.value)}
                  placeholder="0"
                  step="1"
                  min="0"
                  className="k-input"
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
    </>
  );

  return createPortal(modalContent, document.body);
}

