'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAccount, useWaitForTransactionReceipt, useReadContract, useChainId } from 'wagmi';
import { parseEther, formatEther, isAddress } from 'viem';
import { KAS_TIP_ABI } from '@/lib/contracts/abis';
import { getErrorMessage } from '@/lib/utils';
import { useSafeError } from '@/hooks/useSafeError';
import { useWriteContractSafe } from '@/hooks/useWriteContractSafe';
import { UserIcon } from '@/components/users/UserIcon';
import { ProofOfUtility } from '@/components/dapps/ProofOfUtility';
import { AffiliateWidget } from '@/components/dapps/AffiliateWidget';
import { RewardsDisplay } from '@/components/dapps/RewardsDisplay';
import { getContractAddress } from '@/lib/contracts/addresses';

export interface KASTipWidgetProps {
  contractAddress: string;
  proofOfUtilityAddress?: string | null;
  affiliateManagerAddress?: string | null;
  rewardManagerAddress?: string | null;
  dAppTokenAddress?: string | null;
  ticker?: string | null;
  className?: string;
}

interface Tip {
  from: string;
  to: string;
  amount: bigint;
  fee: bigint;
  referral: string;
  timestamp: bigint;
}

interface Tipper {
  user: string;
  totalTipped: bigint;
  tipCount: bigint;
  lastTipTime: bigint;
}

export function KASTipWidget({
  contractAddress,
  proofOfUtilityAddress,
  affiliateManagerAddress,
  rewardManagerAddress,
  dAppTokenAddress,
  ticker,
  className = '',
}: KASTipWidgetProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [referral, setReferral] = useState('');
  const [activeTab, setActiveTab] = useState<'tip' | 'leaderboard' | 'stats'>('tip');
  const [error, setError] = useState<string | null>(null);

  // Get contract stats
  const { data: stats } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: KAS_TIP_ABI,
    functionName: 'getStats',
    query: {
      enabled: !!contractAddress,
      refetchInterval: 30000,
    },
  }) as { data: [bigint, bigint, bigint, bigint] | undefined };

  // Get fee percentage
  const { data: feePercentage } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: KAS_TIP_ABI,
    functionName: 'feePercentage',
    query: {
      enabled: !!contractAddress,
    },
  }) as { data: bigint | undefined };

  // Get user's tipper info
  const { data: userTipper } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: KAS_TIP_ABI,
    functionName: 'tippers',
    args: address ? [address] : undefined,
    query: {
      enabled: !!contractAddress && !!address,
      refetchInterval: 30000,
    },
  }) as { data: Tipper | undefined };

  // Get user's rank
  const { data: userRank } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: KAS_TIP_ABI,
    functionName: 'getUserRank',
    args: address ? [address] : undefined,
    query: {
      enabled: !!contractAddress && !!address,
      refetchInterval: 30000,
    },
  }) as { data: bigint | undefined };

  // Get top tippers
  const { data: topTippers } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: KAS_TIP_ABI,
    functionName: 'getTopTippers',
    args: [10n],
    query: {
      enabled: !!contractAddress,
      refetchInterval: 30000,
    },
  }) as { data: string[] | undefined };

  // Get top tippers details
  const topTippersDetails = useMemo(() => {
    if (!topTippers || topTippers.length === 0) return [];
    
    // We'll need to fetch each tipper's details
    // For now, return addresses
    return topTippers.map((addr, index) => ({
      address: addr,
      rank: index + 1,
    }));
  }, [topTippers]);

  // Write contract for tipping
  // CRITICAL: Use safe wrapper that converts errors before React Query caches them
  const { writeContract, data: hash, isPending: isPendingWrite, error: rawWriteError } = useWriteContractSafe();
  const { isLoading: isConfirming, isSuccess, error: rawTxError } = useWaitForTransactionReceipt({ hash });

  // Immediately convert errors to strings using useSafeError to prevent React serialization issues
  // This ensures errors from wagmi (which can be function-type) are converted before React tries to render them
  // CRITICAL: These hooks MUST be called at the component level, not inside callbacks or conditionals
  const safeWriteError = useSafeError(rawWriteError);
  const safeTxError = useSafeError(rawTxError);

  // CRITICAL: Additional safety check - ensure errors are converted immediately
  // This is a defensive measure in case React Query's mutationCache didn't catch it
  useEffect(() => {
    if (rawWriteError) {
      // Double-check that the error is not a function
      if (typeof rawWriteError === 'function') {
        console.error('CRITICAL: Function-type error detected in rawWriteError - this should have been caught by mutationCache');
        // Force conversion by calling getErrorMessage
        const errorStr = getErrorMessage(rawWriteError, 'Transaction failed');
        // Note: We can't directly modify wagmi's error state, but this ensures we log it
      }
    }
  }, [rawWriteError]);

  useEffect(() => {
    if (rawTxError) {
      // Double-check that the error is not a function
      if (typeof rawTxError === 'function') {
        console.error('CRITICAL: Function-type error detected in rawTxError - this should have been caught by mutationCache');
        // Force conversion by calling getErrorMessage
        const errorStr = getErrorMessage(rawTxError, 'Transaction confirmation failed');
        // Note: We can't directly modify wagmi's error state, but this ensures we log it
      }
    }
  }, [rawTxError]);

  // Calculate fee
  const calculatedFee = useMemo(() => {
    if (!amount || !feePercentage) return '0';
    try {
      const amountWei = parseEther(amount);
      const fee = (amountWei * feePercentage) / 10000n;
      return formatEther(fee);
    } catch {
      return '0';
    }
  }, [amount, feePercentage]);

  const tipAmount = useMemo(() => {
    if (!amount || !calculatedFee) return '0';
    try {
      const amountNum = parseFloat(amount);
      const feeNum = parseFloat(calculatedFee);
      return (amountNum - feeNum).toFixed(6);
    } catch {
      return '0';
    }
  }, [amount, calculatedFee]);

  const handleTip = async () => {
    if (!isConnected || !address) {
      setError('Please connect your wallet');
      return;
    }

    if (!recipient || !isAddress(recipient)) {
      setError('Please enter a valid recipient address');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid tip amount');
      return;
    }

    if (recipient.toLowerCase() === address.toLowerCase()) {
      setError('Cannot tip yourself');
      return;
    }

    setError(null);

    try {
      const amountWei = parseEther(amount);
      const referralAddress = referral && isAddress(referral) ? referral : '0x0000000000000000000000000000000000000000';

      // CRITICAL: Wrap writeContract call and convert any errors IMMEDIATELY
      // This must happen before the error reaches React Query's cache
      // We use a try-catch wrapper around writeContract to intercept errors at the source
      try {
        // Call writeContract - if it throws synchronously, catch it immediately
        const result = writeContract({
          address: contractAddress as `0x${string}`,
          abi: KAS_TIP_ABI,
          functionName: 'tip',
          args: [recipient as `0x${string}`, referralAddress as `0x${string}`],
          value: amountWei,
        });
        
        // If writeContract returns a promise that rejects, we need to catch it
        // However, wagmi's writeContract doesn't return a promise, so errors come via the error state
        // The error will be handled by useSafeError hook above
      } catch (syncErr) {
        // Convert error immediately to prevent 'in' operator issues
        // This catches any synchronous errors before they can be stored anywhere
        const errorMessage = getErrorMessage(syncErr, 'Failed to send tip');
        setError(errorMessage);
        return;
      }
    } catch (err) {
      // Convert error immediately to prevent 'in' operator issues
      const errorMessage = getErrorMessage(err, 'Failed to send tip');
      setError(errorMessage);
    }
  };

  // Reset form on success
  useEffect(() => {
    if (isSuccess) {
      setRecipient('');
      setAmount('');
      setReferral('');
      setTimeout(() => {
        // Refetch stats
      }, 2000);
    }
  }, [isSuccess]);

  const isLoading = isPendingWrite || isConfirming;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">KAS Tipping System</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Tip KAS to anyone and earn rewards for your activity
          </p>
        </div>
        {stats && (
          <div className="text-right">
            <div className="text-sm text-zinc-500 dark:text-zinc-500">Total Tips</div>
            <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {stats[0].toString()}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setActiveTab('tip')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'tip'
              ? 'border-b-2 border-[#02abb8] text-[#02abb8]'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          Send Tip
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'leaderboard'
              ? 'border-b-2 border-[#02abb8] text-[#02abb8]'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          Leaderboard
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'stats'
              ? 'border-b-2 border-[#02abb8] text-[#02abb8]'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          My Stats
        </button>
      </div>

      {/* Tip Tab */}
      {activeTab === 'tip' && (
        <div className="space-y-4">
          {/* Tip Form */}
          <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Recipient Address
                </label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Tip Amount (KAS)
                </label>
                <input
                  type="number"
                  step="0.000001"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.0"
                  className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8]"
                />
                {amount && feePercentage && (
                  <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                    Fee ({formatEther(feePercentage)}%): {calculatedFee} KAS
                    <br />
                    Recipient receives: {tipAmount} KAS
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Referral Address (Optional)
                </label>
                <input
                  type="text"
                  value={referral}
                  onChange={(e) => setReferral(e.target.value)}
                  placeholder="0x... (from ?ref= parameter)"
                  className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8]"
                />
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                  If you were referred by someone, enter their address here
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {(safeWriteError || safeTxError) && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {safeWriteError || safeTxError || 'Transaction failed'}
                  </p>
                </div>
              )}

              {isSuccess && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm text-green-600 dark:text-green-400">
                    ✅ Tip sent successfully! Transaction: {hash?.slice(0, 10)}...
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleTip();
                }}
                disabled={isLoading || !isConnected}
                className="w-full px-4 py-3 bg-[#02abb8] hover:bg-[#0299a6] text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Processing...' : isConnected ? 'Send Tip' : 'Connect Wallet'}
              </button>
            </div>
          </div>

          {/* Ecosystem Integration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {proofOfUtilityAddress && (
              <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
                <ProofOfUtility
                  proofOfUtilityAddress={proofOfUtilityAddress}
                  userAddress={address}
                />
              </div>
            )}

            {affiliateManagerAddress && (
              <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
                <AffiliateWidget
                  affiliateManagerAddress={affiliateManagerAddress}
                  dAppContractAddress={contractAddress}
                />
              </div>
            )}
          </div>

          {dAppTokenAddress && (
            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
              <RewardsDisplay
                gridTokenAddress={getContractAddress(chainId, 'GRIDToken') || undefined}
                dAppTokenAddress={dAppTokenAddress}
                ticker={ticker || undefined}
              />
            </div>
          )}
        </div>
      )}

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-4">
          <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              Top Tippers
            </h3>
            {topTippersDetails.length > 0 ? (
              <div className="space-y-2">
                {topTippersDetails.map((tipper, index) => (
                  <div
                    key={tipper.address}
                    className="flex items-center justify-between p-3 bg-white dark:bg-zinc-800 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#02abb8]/20 text-[#02abb8] font-bold text-sm">
                        {tipper.rank}
                      </div>
                      <UserIcon address={tipper.address} size={32} />
                      <div>
                        <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {tipper.address.slice(0, 6)}...{tipper.address.slice(-4)}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">
                      {/* We'd need to fetch totalTipped for each address */}
                      Loading...
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500 dark:text-zinc-500 text-center py-8">
                No tippers yet. Be the first!
              </p>
            )}
          </div>
        </div>
      )}

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <div className="space-y-4">
          {isConnected && address ? (
            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                Your Tipping Stats
              </h3>
              {userTipper ? (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">Total Tipped:</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatEther(userTipper.totalTipped)} KAS
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">Tip Count:</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {userTipper.tipCount.toString()}
                    </span>
                  </div>
                  {userRank && userRank > 0n && (
                    <div className="flex justify-between">
                      <span className="text-zinc-600 dark:text-zinc-400">Leaderboard Rank:</span>
                      <span className="font-semibold text-[#02abb8]">
                        #{userRank.toString()}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-zinc-500 dark:text-zinc-500">
                  You haven&apos;t sent any tips yet.
                </p>
              )}
            </div>
          ) : (
            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 text-center">
              <p className="text-sm text-zinc-500 dark:text-zinc-500">
                Connect your wallet to view your stats
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

