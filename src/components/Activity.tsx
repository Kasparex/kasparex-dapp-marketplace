'use client';

import { useState, useEffect } from 'react';
import { useAccount, usePublicClient, useChainId } from 'wagmi';
import { formatEther, decodeEventLog } from 'viem';
import { getContractAddress, CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { SIMPLE_PAYMENT_ABI } from '@/lib/contracts/abis';
import Link from 'next/link';

interface ActivityItem {
  hash: string;
  timestamp: number;
  type: 'payment' | 'subscription' | 'other';
  dAppName?: string;
  dAppSlug?: string;
  amount?: string;
  recipient?: string;
  status: 'pending' | 'success' | 'failed';
  blockNumber?: bigint;
  network?: 'testnet' | 'mainnet';
  chainId?: number;
}

interface ActivityProps {
  walletAddress: string;
}

export function Activity({ walletAddress }: ActivityProps) {
  const { address: connectedAddress, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const chainId = useChainId();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Get contract addresses with fallback (same pattern as SimplePaymentWidget)
  const getSimplePaymentAddress = (): string => {
    let address = '';
    
    // Try using getContractAddress function
    try {
      if (CONTRACT_ADDRESSES && typeof getContractAddress === 'function') {
        address = getContractAddress(chainId, 'SimplePayment') || '';
      }
    } catch (e) {
      console.warn('getContractAddress not available, using fallback', e);
    }
    
    // Fallback to direct CONTRACT_ADDRESSES access
    if (!address) {
      try {
        if (CONTRACT_ADDRESSES) {
          if (chainId === 202555 && CONTRACT_ADDRESSES.kasplexL2Mainnet) {
            address = CONTRACT_ADDRESSES.kasplexL2Mainnet.SimplePayment || '';
          } else if (chainId === 167012 && CONTRACT_ADDRESSES.kasplexL2Testnet) {
            address = CONTRACT_ADDRESSES.kasplexL2Testnet.SimplePayment || '';
          }
        }
      } catch (e) {
        console.error('Error accessing CONTRACT_ADDRESSES', e);
      }
    }
    
    // Hardcode testnet address as final fallback
    if (!address && chainId === 167012) {
      address = '0x3F19cC54231fB10b1935FA3f04Bec64b8AFeAd85';
    }
    
    return address;
  };
  
  const simplePaymentAddress = getSimplePaymentAddress();

  // Load persisted activities from all networks on mount (runs first, before blockchain fetch)
  useEffect(() => {
    if (!walletAddress || !walletAddress.startsWith('0x') || walletAddress.length !== 42) {
      return;
    }
    
    const allPersistedActivities: ActivityItem[] = [];
    
    // Load from both testnet and mainnet
    const testnetKey = `activity_${walletAddress.toLowerCase()}_167012`;
    const mainnetKey = `activity_${walletAddress.toLowerCase()}_202555`;
    
    [testnetKey, mainnetKey].forEach(key => {
      const persisted = localStorage.getItem(key);
      if (persisted) {
        try {
          const parsed = JSON.parse(persisted);
          allPersistedActivities.push(...parsed);
        } catch (e) {
          console.error('Error parsing persisted activities:', e);
        }
      }
    });
    
    if (allPersistedActivities.length > 0) {
      // Filter out activities older than 90 days
      const ninetyDaysAgo = Date.now() / 1000 - (90 * 24 * 60 * 60);
      const filtered = allPersistedActivities.filter(activity => activity.timestamp > ninetyDaysAgo);
      
      // Remove duplicates by hash (keep newest)
      const uniqueActivities = new Map<string, ActivityItem>();
      for (const activity of filtered) {
        const hash = activity.hash.toLowerCase();
        const existing = uniqueActivities.get(hash);
        if (!existing || activity.timestamp > existing.timestamp) {
          uniqueActivities.set(hash, activity);
        }
      }
      
      // Sort by timestamp (newest first)
      const sorted = Array.from(uniqueActivities.values()).sort((a, b) => b.timestamp - a.timestamp);
      
      setActivities(sorted);
      setLoading(false);
    }
  }, [walletAddress]);

  // Fetch transactions for the wallet from blockchain
  useEffect(() => {
    if (!publicClient || !walletAddress) {
      return;
    }

    // Validate wallet address format
    if (!walletAddress.startsWith('0x') || walletAddress.length !== 42) {
      console.error('Invalid wallet address format:', walletAddress);
      return;
    }

    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const activitiesList: ActivityItem[] = [];

        // Get all transactions from deployment block (or block 0 if not available)
        // For testnet, we'll use a reasonable starting point, for mainnet we'll fetch from deployment
        const currentBlock = await publicClient.getBlockNumber();
        // Fetch from a much wider range - last 10,000 blocks (approximately 1-2 days depending on block time)
        // For production, you might want to fetch from deployment block or use an indexing service
        const fromBlock = currentBlock > 10000n ? currentBlock - 10000n : 0n;
        
        // Also load persisted transactions from localStorage
        const storageKey = `activity_${walletAddress.toLowerCase()}_${chainId}`;
        const persistedActivities = localStorage.getItem(storageKey);
        let existingActivities: ActivityItem[] = [];
        if (persistedActivities) {
          try {
            existingActivities = JSON.parse(persistedActivities);
            // Filter out activities older than 90 days to prevent localStorage from getting too large
            const ninetyDaysAgo = Date.now() / 1000 - (90 * 24 * 60 * 60);
            existingActivities = existingActivities.filter(activity => activity.timestamp > ninetyDaysAgo);
          } catch (e) {
            console.error('Error parsing persisted activities:', e);
          }
        }
        
        // Create a map of existing activities by hash to avoid duplicates
        const existingHashes = new Set(existingActivities.map(a => a.hash.toLowerCase()));

        // Fetch events from SimplePayment contract
        if (simplePaymentAddress && simplePaymentAddress.startsWith('0x') && simplePaymentAddress.length === 42) {
          try {
            const paymentEvents = await publicClient.getLogs({
              address: simplePaymentAddress as `0x${string}`,
              event: {
                type: 'event',
                name: 'PaymentSent',
                inputs: [
                  { name: 'from', type: 'address', indexed: true },
                  { name: 'to', type: 'address', indexed: true },
                  { name: 'amount', type: 'uint256', indexed: false },
                  { name: 'fee', type: 'uint256', indexed: false },
                  { name: 'timestamp', type: 'uint256', indexed: false },
                ],
              } as any,
              args: {
                from: walletAddress.toLowerCase() as `0x${string}`,
              } as any,
              fromBlock,
              toBlock: 'latest',
            });

            // Process payment events
            for (const log of paymentEvents) {
              try {
                const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
                const tx = await publicClient.getTransaction({ hash: log.transactionHash });
                
                // Decode event args using viem's decodeEventLog
                let decodedLog;
                try {
                  decodedLog = decodeEventLog({
                    abi: SIMPLE_PAYMENT_ABI,
                    data: log.data,
                    topics: log.topics,
                  });
                } catch (decodeError) {
                  console.error('Error decoding event log:', decodeError);
                  // Fallback: use basic info
                  const txHash = log.transactionHash.toLowerCase();
                  if (!existingHashes.has(txHash)) {
                    activitiesList.push({
                      hash: log.transactionHash,
                      timestamp: Number(block.timestamp),
                      type: 'payment',
                      dAppName: 'Simple Payment',
                      dAppSlug: 'simple-payment',
                      status: tx && tx.blockNumber ? 'success' : 'pending',
                      blockNumber: log.blockNumber,
                      network: chainId === 167012 ? 'testnet' : chainId === 202555 ? 'mainnet' : undefined,
                      chainId: chainId,
                    });
                  }
                  continue;
                }
                
                const args = decodedLog.args as any;
                
                // Only add if not already in persisted activities
                const txHash = log.transactionHash.toLowerCase();
                if (!existingHashes.has(txHash)) {
                  activitiesList.push({
                    hash: log.transactionHash,
                    timestamp: Number(block.timestamp),
                    type: 'payment',
                    dAppName: 'Simple Payment',
                    dAppSlug: 'simple-payment',
                    amount: formatEther(args.amount || 0n),
                    recipient: args.to || args._to,
                    status: tx && tx.blockNumber ? 'success' : 'pending',
                    blockNumber: log.blockNumber,
                    network: chainId === 167012 ? 'testnet' : chainId === 202555 ? 'mainnet' : undefined,
                    chainId: chainId,
                  });
                }
              } catch (err) {
                console.error('Error processing payment event:', err);
                // Still add the transaction with basic info
                try {
                  const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
                  const txHash = log.transactionHash.toLowerCase();
                  if (!existingHashes.has(txHash)) {
                    activitiesList.push({
                      hash: log.transactionHash,
                      timestamp: Number(block.timestamp),
                      type: 'payment',
                      dAppName: 'Simple Payment',
                      dAppSlug: 'simple-payment',
                      status: 'success',
                      blockNumber: log.blockNumber,
                      network: chainId === 167012 ? 'testnet' : chainId === 202555 ? 'mainnet' : undefined,
                      chainId: chainId,
                    });
                  }
                } catch (blockError) {
                  // Last resort: use current time
                  const txHash = log.transactionHash.toLowerCase();
                  if (!existingHashes.has(txHash)) {
                    activitiesList.push({
                      hash: log.transactionHash,
                      timestamp: Date.now() / 1000,
                      type: 'payment',
                      dAppName: 'Simple Payment',
                      dAppSlug: 'simple-payment',
                      status: 'success',
                      blockNumber: log.blockNumber,
                      network: chainId === 167012 ? 'testnet' : chainId === 202555 ? 'mainnet' : undefined,
                      chainId: chainId,
                    });
                  }
                }
              }
            }
          } catch (error) {
            console.error('Error fetching payment events:', error);
          }
        }

        // Merge with existing persisted activities
        const allActivities = [...existingActivities, ...activitiesList];
        
        // Remove duplicates by hash (keep newest)
        const uniqueActivities = new Map<string, ActivityItem>();
        for (const activity of allActivities) {
          const hash = activity.hash.toLowerCase();
          const existing = uniqueActivities.get(hash);
          if (!existing || activity.timestamp > existing.timestamp) {
            uniqueActivities.set(hash, activity);
          }
        }
        
        // Convert back to array and sort by timestamp (newest first)
        const sortedActivities = Array.from(uniqueActivities.values()).sort((a, b) => b.timestamp - a.timestamp);
        
        // Persist to localStorage
        try {
          localStorage.setItem(storageKey, JSON.stringify(sortedActivities));
        } catch (e) {
          console.warn('Failed to persist activities to localStorage:', e);
        }

        setActivities(sortedActivities);
      } catch (error) {
        console.error('Error fetching activities:', error);
        // Set empty array on error to show "no activity" message
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if we have all required data
    if (publicClient && walletAddress && simplePaymentAddress) {
      fetchTransactions();

      // Poll for new transactions every 30 seconds
      const interval = setInterval(fetchTransactions, 30000);
      return () => clearInterval(interval);
    } else {
      setLoading(false);
    }
  }, [publicClient, walletAddress, simplePaymentAddress]);

  const copyToClipboard = async (hash: string) => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopiedHash(hash);
      setTimeout(() => setCopiedHash(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getExplorerUrl = (hash: string, activityChainId?: number) => {
    const txChainId = activityChainId || chainId;
    if (txChainId === 167012) {
      return `https://explorer.testnet.kasplextest.xyz/tx/${hash}`;
    } else if (txChainId === 202555) {
      return `https://explorer.kasplex.org/tx/${hash}`;
    }
    return `#`;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  // Validate wallet address format
  const isValidWalletAddress = walletAddress && walletAddress.startsWith('0x') && walletAddress.length === 42;

  if (!isValidWalletAddress) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <p className="text-gray-600 dark:text-gray-400 text-center">
          Invalid wallet address
        </p>
      </div>
    );
  }


  if (!isConnected || !publicClient) {
    // Still show persisted activities even if not connected
    if (activities.length > 0) {
      return (
        <div className="w-full">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Activity
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              View your transaction history and dApp interactions
            </p>
            <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
              ⚠️ Showing cached transactions. Connect wallet to fetch latest.
            </p>
          </div>
          {/* Render activities below */}
        </div>
      );
    }
    
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <p className="text-gray-600 dark:text-gray-400 text-center">
          {!isConnected ? 'Please connect your wallet to view activity' : 'Loading blockchain connection...'}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Activity
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          View your transaction history and dApp interactions
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading activity...</span>
        </div>
      ) : activities.length === 0 ? (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            No activity found. Start using dApps to see your transactions here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.hash}
              className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded ${
                        activity.type === 'payment'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                          : activity.type === 'subscription'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                      }`}
                    >
                      {activity.type === 'payment' ? '💳 Payment' : activity.type === 'subscription' ? '📅 Subscription' : '🔗 Transaction'}
                    </span>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded ${
                        activity.status === 'success'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : activity.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      }`}
                    >
                      {activity.status === 'success' ? '✓ Success' : activity.status === 'pending' ? '⏳ Pending' : '✗ Failed'}
                    </span>
                    {activity.network && (
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded ${
                          activity.network === 'testnet'
                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                            : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300'
                        }`}
                      >
                        {activity.network === 'testnet' ? '🧪 Testnet' : '🌐 Mainnet'}
                      </span>
                    )}
                  </div>

                  {activity.dAppName && (
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {activity.dAppName}
                    </h3>
                  )}

                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    {activity.amount && (
                      <p>
                        <span className="font-medium">Amount:</span> {activity.amount} KAS
                      </p>
                    )}
                    {activity.recipient && (
                      <p>
                        <span className="font-medium">Recipient:</span>{' '}
                        <span className="font-mono text-xs">
                          {activity.recipient.slice(0, 6)}...{activity.recipient.slice(-4)}
                        </span>
                      </p>
                    )}
                    <p>
                      <span className="font-medium">Date:</span> {formatDate(activity.timestamp)}
                    </p>
                  </div>

                  {/* Transaction Hash */}
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-500 font-mono">
                      TX: {activity.hash.slice(0, 10)}...{activity.hash.slice(-8)}
                    </span>
                    <button
                      onClick={() => copyToClipboard(activity.hash)}
                      className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                      title="Copy transaction hash"
                    >
                      {copiedHash === activity.hash ? '✓ Copied' : '📋 Copy'}
                    </button>
                    <a
                      href={getExplorerUrl(activity.hash, activity.chainId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded transition-colors"
                    >
                      🔗 View on Explorer
                    </a>
                  </div>
                </div>

                {/* dApp Link Button */}
                {activity.dAppSlug && (
                  <div className="ml-4">
                    <Link
                      href={`/dapps/${activity.dAppSlug}`}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
                    >
                      Open dApp
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

