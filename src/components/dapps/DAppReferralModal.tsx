'use client';

import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useAccount, useChainId } from 'wagmi';
import { DApp } from '@/lib/dapps';
import { useAffiliate } from '@/hooks/useAffiliate';

interface DAppReferralModalProps {
  dapp: DApp;
  contractAddress?: string;
}

export function DAppReferralModal({ dapp, contractAddress }: DAppReferralModalProps) {
  const { address } = useAccount();
  const chainId = useChainId();
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Use contract-based affiliate if contract address provided
  const useContractMode = !!contractAddress && contractAddress.startsWith('0x');
  
  const { referralCount, referrals, isLoading: isLoadingAffiliate } = useAffiliate(
    useContractMode ? undefined : undefined, // affiliateManagerAddress would go here if available
    useContractMode ? contractAddress : undefined
  );

  const referralLink = useMemo(() => {
    if (!address) return '';
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    if (useContractMode && contractAddress) {
      return `${baseUrl}/dapps/${dapp.slug || dapp.id}?ref=${address}&contract=${contractAddress}`;
    }
    return `${baseUrl}/dapps/${dapp.slug || dapp.id}?ref=${address}`;
  }, [address, dapp.slug, dapp.id, useContractMode, contractAddress]);

  const handleCopy = async () => {
    if (!referralLink) return;
    
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (!address) {
    return null; // Don't show icon if wallet not connected
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
        title="Referral Link"
        aria-label="View referral link"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-5.656-5.657l1.102-1.101m0 0l4-4m-4 4l4 4m6-8l-4-4m4 4l-4 4m-4-4l4-4m4 4l4 4" />
        </svg>
      </button>

      {/* Referral Modal */}
      {showModal && typeof window !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
          
          <div
            className="relative bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-zinc-200 dark:border-zinc-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Referral Program
                </h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                  Share {dapp.name} and earn rewards
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                  How It Works
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                  Share your referral link to earn rewards when others use {dapp.name}. You&apos;ll receive rewards for every user who interacts with the dApp through your link.
                </p>
              </div>

              {/* Referral Stats */}
              {useContractMode && !isLoadingAffiliate && (
                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm font-semibold text-green-800 dark:text-green-300 mb-1">
                    📊 Your Referrals
                  </p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-200">
                    {referralCount?.toString() || '0'}
                  </p>
                </div>
              )}

              {/* Referral Link */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                  Your Referral Link
                </h3>
                <button
                  onClick={handleCopy}
                  className="w-full px-4 py-3 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left font-mono break-all flex items-center justify-between"
                >
                  <span className="truncate mr-2">{referralLink}</span>
                  <span className="flex-shrink-0 text-zinc-500 dark:text-zinc-400">
                    {copied ? '✓ Copied!' : 'Copy'}
                  </span>
                </button>
              </div>

              {/* Rewards Info */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  💡 You&apos;ll earn rewards when users click your referral link and interact with this dApp. The more referrals you bring, the more you earn!
                </p>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

