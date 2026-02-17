'use client';

import { useState, useEffect } from 'react';
import { useAccount, useChainId, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, type Address } from 'viem';
import { DApp, getDAppNetworkType } from '@/lib/dapps';
import { RevenueTree } from '@/components/revenue-tree/RevenueTree';
import { generateMockRevenueTree } from '@/lib/revenue-tree/mockData';
import { generateDAppSlug } from '@/lib/utils';
import { getStoredReferral } from '@/lib/revenue-tree/referral';
import { markUserActivated, hasUserActivated } from '@/lib/revenue-tree/utils';
import { getContractAddress } from '@/lib/contracts/addresses';
import { getErrorMessage } from '@/lib/utils';

// SimplePayment contract ABI (simplified - only pay function)
const SIMPLE_PAYMENT_ABI = [
  {
    name: 'pay',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      {
        name: 'recipient',
        type: 'address',
      },
    ],
    outputs: [],
  },
] as const;

interface DAppActionsColumnProps {
  dapp: DApp;
  contractAddress?: string;
}

export function DAppActionsColumn({ dapp, contractAddress }: DAppActionsColumnProps) {
  const { address: userWalletAddress, isConnected } = useAccount();
  const chainId = useChainId();
  const slug = dapp.slug || generateDAppSlug(dapp.name);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [activationAmount, setActivationAmount] = useState(0); // Track amount spent toward activation
  
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Check if dApp is L2
  const networkType = getDAppNetworkType(dapp);
  const isL2 = networkType === 'L2';

  // Generate revenue tree data with proper activation status and referral chain
  // The generateMockRevenueTree function already handles referral addresses from localStorage
  // which is set by the ReferralTracker component
  const revenueTreeData = generateMockRevenueTree(
    dapp.id,
    slug,
    userWalletAddress,
    chainId,
    userWalletAddress ? hasUserActivated(userWalletAddress, 'dapp', slug) : false
  );
  
  // Load activation amount from localStorage (mock - in production, fetch from contract/backend)
  useEffect(() => {
    if (userWalletAddress && typeof window !== 'undefined') {
      const key = `revenue_tree_spent:${dapp.id}:${userWalletAddress}`;
      const spent = localStorage.getItem(key);
      if (spent) {
        setActivationAmount(parseFloat(spent));
      }
    }
  }, [userWalletAddress, dapp.id]);

  // Get contract address
  const dappContractAddress = contractAddress || getContractAddress(chainId, 'SimplePayment') || '';
  
  // Handle Pay action
  const handlePay = async () => {
    if (!isConnected || !userWalletAddress) {
      setError('Please connect your wallet');
      return;
    }

    if (!dappContractAddress) {
      setError('Contract address not found. Please switch to a supported network.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setTxHash(null);

    try {
      // Amount: 100 KAS (minimum activation amount)
      const amount = parseEther('100');
      
      // For now, send to the contract address itself
      // In production, this would go to a specific recipient
      const recipient = dappContractAddress as Address;

      // Call the pay function
      writeContract({
        address: dappContractAddress as Address,
        abi: SIMPLE_PAYMENT_ABI,
        functionName: 'pay',
        args: [recipient],
        value: amount,
      });
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Failed to send payment');
      setError(errorMessage);
      setIsProcessing(false);
    }
  };

  // Handle transaction success
  useEffect(() => {
    if (isConfirmed && hash && !txHash) {
      setTxHash(hash);
      setIsProcessing(false);
      
      // Mark user as activated and set activation amount to 100
      if (userWalletAddress) {
        markUserActivated(userWalletAddress, 'dapp', slug);
        const key = `revenue_tree_spent:${dapp.id}:${userWalletAddress}`;
        localStorage.setItem(key, '100');
        setActivationAmount(100);
      }
      
      // Refresh the page to update Revenue Tree
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  }, [isConfirmed, hash, txHash, userWalletAddress, slug, dapp.id]);

  // Handle transaction error
  useEffect(() => {
    if (writeError && !error) {
      setError(getErrorMessage(writeError, 'Transaction failed'));
      setIsProcessing(false);
    }
  }, [writeError, error]);

  // Handle Send action (placeholder for now)
  const handleSend = async () => {
    if (!isConnected || !userWalletAddress) {
      setError('Please connect your wallet');
      return;
    }
    setError('Send functionality coming soon');
  };

  const isLoading = isPending || isConfirming || isProcessing;

  return (
    <div className="space-y-6">
      {/* Action Buttons Section */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest mb-4">
          Actions
        </h3>
        <div className="space-y-3">
          {/* Pay Button - Functional */}
          <button
            onClick={handlePay}
            disabled={!isConnected || isLoading || !dappContractAddress}
            className="w-full py-3 px-4 bg-[#02abb8] hover:bg-[#0299a6] disabled:bg-zinc-400 disabled:cursor-not-allowed text-white font-black text-sm uppercase tracking-wider rounded-lg transition-colors"
          >
            {isLoading ? 'Processing...' : 'Pay 100 KAS'}
          </button>
          
          {/* Send Button - Placeholder */}
          <button
            onClick={handleSend}
            disabled={!isConnected || isLoading}
            className="w-full py-3 px-4 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:bg-zinc-400 disabled:cursor-not-allowed text-zinc-900 dark:text-zinc-100 font-bold text-sm uppercase tracking-wider rounded-lg transition-colors"
          >
            Send
          </button>
          
          {/* Error Message */}
          {error && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
          
          {/* Success Message */}
          {isConfirmed && txHash && (
            <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400">
                Payment successful! Revenue Tree activated.
              </p>
              {chainId && (
                <a
                  href={`https://explorer.testnet.kasplextest.xyz/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-green-600 dark:text-green-400 underline mt-1 block"
                >
                  View transaction
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Costs and Fees Section */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest mb-4">
          Costs & Fees
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Base Cost</span>
            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">100 KAS</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Network Fee</span>
            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">~0.001 KAS</span>
          </div>
          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Total</span>
              <span className="text-lg font-black text-[#02abb8]">100.001 KAS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rewards & Fee Reductions (Magazines-style) */}
      <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest mb-4">
          Rewards & Reductions
        </h3>
        <div className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-[#02abb8] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>GRID rewards on each action</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>KREX tier reduces fees</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-purple-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>NFT holders get extra discount</span>
          </div>
        </div>
      </div>

      {/* Revenue Tree Section - Only show for L2 dApps */}
      {isL2 && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <RevenueTree
            data={revenueTreeData}
            userWalletAddress={userWalletAddress || undefined}
            isL2Only={true}
            activationAmount={activationAmount}
          />
        </div>
      )}
    </div>
  );
}
