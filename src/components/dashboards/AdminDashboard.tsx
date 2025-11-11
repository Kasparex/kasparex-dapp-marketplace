/**
 * Admin Dashboard Widget
 * Simplified admin UI for platform management
 */

'use client';

import { useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { isAdminAddress } from '@/lib/admin';
import { ADMIN_DASHBOARD_ABI, DAPP_REGISTRY_ABI } from '@/lib/contracts/abis';

export interface AdminDashboardProps {
  adminDashboardAddress?: string;
  dAppRegistryAddress?: string;
  className?: string;
}

export function AdminDashboard({
  adminDashboardAddress,
  dAppRegistryAddress,
  className = '',
}: AdminDashboardProps) {
  const { address, isConnected } = useAccount();
  const [selectedDAppId, setSelectedDAppId] = useState('');
  const [pendingOperationId, setPendingOperationId] = useState('');

  const isAdmin = address ? isAdminAddress(address) : false;

  // Get pending operations
  const { data: pendingOperations } = useReadContract({
    address: adminDashboardAddress as `0x${string}`,
    abi: ADMIN_DASHBOARD_ABI,
    functionName: 'getPendingOperations',
    query: {
      enabled: isAdmin && !!adminDashboardAddress,
      refetchInterval: 30000,
    },
  }) as { data: string[] | undefined };

  const { writeContract, data: operationHash, isPending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash: operationHash,
  });

  const handleApproveDApp = async () => {
    if (!selectedDAppId || !adminDashboardAddress) return;

    try {
      await writeContract({
        address: adminDashboardAddress as `0x${string}`,
        abi: ADMIN_DASHBOARD_ABI,
        functionName: 'approveDApp',
        args: [BigInt(selectedDAppId)],
      });
    } catch (error) {
      console.error('Failed to approve dApp:', error);
    }
  };

  const handleApproveOperation = async () => {
    if (!pendingOperationId || !adminDashboardAddress) return;

    try {
      await writeContract({
        address: adminDashboardAddress as `0x${string}`,
        abi: ADMIN_DASHBOARD_ABI,
        functionName: 'approveOperation',
        args: [pendingOperationId as `0x${string}`],
      });
    } catch (error) {
      console.error('Failed to approve operation:', error);
    }
  };

  if (!isConnected || !isAdmin) {
    return (
      <div className={`p-6 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 ${className}`}>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Admin access required
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Admin Dashboard
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Manage platform settings and dApp approvals
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            Approve dApp
          </h3>
          <div className="flex gap-2">
            <input
              type="number"
              value={selectedDAppId}
              onChange={(e) => setSelectedDAppId(e.target.value)}
              className="flex-1 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100"
              placeholder="dApp ID"
            />
            <button
              onClick={handleApproveDApp}
              disabled={!selectedDAppId || isPending || isConfirming}
              className="px-4 py-2 bg-[#02abb8] hover:bg-[#0199a3] text-white rounded-lg transition-colors disabled:opacity-50"
            >
              Approve
            </button>
          </div>
        </div>

        {pendingOperations !== undefined && Array.isArray(pendingOperations) && pendingOperations.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              Pending Operations ({pendingOperations.length})
            </h3>
            <div className="space-y-2">
              {pendingOperations.slice(0, 5).map((opId: string, index: number) => (
                <div
                  key={index}
                  className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center justify-between"
                >
                  <span className="text-sm font-mono text-zinc-600 dark:text-zinc-400">
                    {opId.substring(0, 10)}...
                  </span>
                  <button
                    onClick={() => {
                      setPendingOperationId(opId);
                      handleApproveOperation();
                    }}
                    disabled={isPending || isConfirming}
                    className="px-3 py-1 bg-[#02abb8] hover:bg-[#0199a3] text-white text-sm rounded transition-colors disabled:opacity-50"
                  >
                    Approve
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

