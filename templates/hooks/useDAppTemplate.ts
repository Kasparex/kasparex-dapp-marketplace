'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useChainId, usePublicClient } from 'wagmi';
import { parseEther, formatEther } from 'viem';
// TODO: Import your contract ABI
import { {{CONTRACT_NAME}}_ABI } from '@/lib/contracts/abis';
import { getContractAddress } from '@/lib/contracts/addresses';
import { useSafeError } from './useSafeError';

// TODO: Define your data interfaces
export interface {{ItemInterface}} {
  id: bigint;
  // TODO: Add your interface fields
  // field1: string;
  // field2: bigint;
  // field3: address;
  // timestamp: bigint;
}

interface Use{{HookName}}Return {
  // TODO: Define your hook return interface
  items: {{ItemInterface}}[];
  isLoading: boolean;
  error: string | null;
  // TODO: Add your function signatures
  // createItem: (param1: string, param2: bigint) => Promise<void>;
  // updateItem: (itemId: bigint, newValue: string) => Promise<void>;
  // getItem: (itemId: bigint) => Promise<{{ItemInterface}} | null>;
  refreshItems: () => Promise<void>;
  // TODO: Add your state variables
  // itemCount: bigint | null;
  // fee: bigint | null;
}

export function use{{HookName}}(): Use{{HookName}}Return {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const [items, setItems] = useState<{{ItemInterface}}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // TODO: Get contract address - replace '{{CONTRACT_NAME}}' with your contract name
  const contractAddress = getContractAddress(chainId, '{{CONTRACT_NAME}}');

  // TODO: Read contract state variables
  // Example: Read item count
  // const { data: itemCount } = useReadContract({
  //   address: contractAddress as `0x${string}`,
  //   abi: {{CONTRACT_NAME}}_ABI,
  //   functionName: 'itemCount',
  //   query: {
  //     enabled: !!contractAddress && isConnected,
  //   },
  // });

  // Example: Read fee
  // const { data: fee } = useReadContract({
  //   address: contractAddress as `0x${string}`,
  //   abi: {{CONTRACT_NAME}}_ABI,
  //   functionName: 'fee',
  //   query: {
  //     enabled: !!contractAddress && isConnected,
  //   },
  // });

  // Write contract
  const { writeContract, data: hash, isPending: isPendingWrite, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed, error: txError } = useWaitForTransactionReceipt({
    hash,
  });

  // CRITICAL: Convert errors to strings immediately to prevent React serialization issues
  const safeWriteError = useSafeError(writeError);
  const safeTxError = useSafeError(txError);

  // TODO: Load items from contract
  const loadItems = useCallback(async () => {
    if (!contractAddress || !publicClient) {
      setItems([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // TODO: Implement your data loading logic
      // Example: Load items using getItems function
      // const batchSize = 50;
      // const fetchedItems: {{ItemInterface}}[] = [];
      // 
      // // Get item count first
      // const count = await publicClient.readContract({
      //   address: contractAddress as `0x${string}`,
      //   abi: {{CONTRACT_NAME}}_ABI,
      //   functionName: 'itemCount',
      // });
      // 
      // const totalItems = Number(count);
      // 
      // // Fetch items in batches
      // for (let offset = 0; offset < totalItems; offset += batchSize) {
      //   const limit = Math.min(batchSize, totalItems - offset);
      //   try {
      //     const batch = await publicClient.readContract({
      //       address: contractAddress as `0x${string}`,
      //       abi: {{CONTRACT_NAME}}_ABI,
      //       functionName: 'getItems',
      //       args: [BigInt(offset), BigInt(limit)],
      //     });
      //     fetchedItems.push(...(batch as {{ItemInterface}}[]));
      //   } catch (err) {
      //     console.error(`Error loading items batch ${offset}-${offset + limit}:`, err);
      //     // Fallback: fetch items one by one
      //     for (let i = offset + 1; i <= Math.min(offset + limit, totalItems); i++) {
      //       try {
      //         const item = await publicClient.readContract({
      //           address: contractAddress as `0x${string}`,
      //           abi: {{CONTRACT_NAME}}_ABI,
      //           functionName: 'getItem',
      //           args: [BigInt(i)],
      //         });
      //         fetchedItems.push(item as {{ItemInterface}});
      //       } catch (err2) {
      //         console.error(`Error loading item ${i}:`, err2);
      //       }
      //     }
      //   }
      // }
      // 
      // setItems(fetchedItems);
    } catch (err) {
      console.error('Error loading items:', err);
      setError(err instanceof Error ? err.message : 'Failed to load items');
    } finally {
      setIsLoading(false);
    }
  }, [contractAddress, publicClient]);

  // Refresh items
  const refreshItems = useCallback(async () => {
    await loadItems();
  }, [loadItems]);

  // TODO: Create item function
  // const createItem = useCallback(async (param1: string, param2: bigint) => {
  //   if (!contractAddress || !fee) {
  //     throw new Error('Contract not available');
  //   }
  // 
  //   setError(null);
  // 
  //   try {
  //     await writeContract({
  //       address: contractAddress as `0x${string}`,
  //       abi: {{CONTRACT_NAME}}_ABI,
  //       functionName: 'yourMainFunction',
  //       args: [param1, param2],
  //       value: fee, // Include fee if required
  //     });
  //   } catch (err) {
  //     const errorMessage = err instanceof Error ? err.message : 'Failed to create item';
  //     setError(errorMessage);
  //     throw err;
  //   }
  // }, [contractAddress, fee, writeContract]);

  // Refresh items when transaction is confirmed
  useEffect(() => {
    if (isConfirmed && !isConfirming) {
      setTimeout(() => {
        loadItems();
      }, 2000);
    }
  }, [isConfirmed, isConfirming, loadItems]);

  // Load items on mount and when dependencies change
  useEffect(() => {
    if (contractAddress) {
      loadItems();
    }
  }, [contractAddress, loadItems]);

  // Update error from transaction
  useEffect(() => {
    if (safeWriteError || safeTxError) {
      setError(safeWriteError || safeTxError || null);
    }
  }, [safeWriteError, safeTxError]);

  return {
    items,
    isLoading: isLoading || isPendingWrite || isConfirming,
    error: error || safeWriteError || safeTxError,
    // TODO: Export your functions
    // createItem,
    // updateItem,
    // getItem,
    refreshItems,
    // TODO: Export your state variables
    // itemCount: itemCount || null,
    // fee: fee || null,
  };
}

