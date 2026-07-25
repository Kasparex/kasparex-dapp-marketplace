'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useMyDApps } from '@/hooks/useMyDApps';
import { useDAppSubscriptionPlan } from '@/hooks/useDAppSubscriptions';
import { DAPP_SUBSCRIPTION_ABI } from '@/lib/contracts/abis';
import { getContractAddress, CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { useChainId } from 'wagmi';
import { parseEther } from 'viem';
import { getErrorMessage } from '@/lib/utils';
import { useSafeError } from '@/hooks/useSafeError';
import Link from 'next/link';
import { KxFormDropdown } from '@/components/ui/KxFormDropdown';

export function SubscriptionManager() {
  const { dApps } = useMyDApps();
  const [selectedDApp, setSelectedDApp] = useState<string | null>(null);
  const [monthlyPrice, setMonthlyPrice] = useState('');
  const [quarterlyPrice, setQuarterlyPrice] = useState('');
  const [yearlyPrice, setYearlyPrice] = useState('');
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  // Get dApps with contracts
  const dAppsWithContracts = dApps.filter((dapp) => dapp.contractAddress?.startsWith('0x'));

  // Get DAppSubscription address
  const dAppSubscriptionAddress = (() => {
    try {
      if (typeof getContractAddress === 'function') {
        return getContractAddress(chainId, 'DAppSubscription') || '';
      }
    } catch (e) {
      console.warn('getContractAddress not available, using fallback');
    }

    if (CONTRACT_ADDRESSES) {
      if (chainId === 202555 && CONTRACT_ADDRESSES.kasplexL2Mainnet) {
        return CONTRACT_ADDRESSES.kasplexL2Mainnet.DAppSubscription || '';
      } else if (chainId === 167012 && CONTRACT_ADDRESSES.kasplexL2Testnet) {
        return CONTRACT_ADDRESSES.kasplexL2Testnet.DAppSubscription || '';
      }
    }
    return '';
  })();

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  
  // Safely convert error to string immediately
  const safeError = useSafeError(error);

  // Fetch plan for selected dApp
  const { plan, isLoading: isLoadingPlan } = useDAppSubscriptionPlan(
    selectedDApp || undefined
  );

  // Load existing plan data
  useEffect(() => {
    if (selectedDApp && plan) {
      setMonthlyPrice(plan.monthlyPrice);
      setQuarterlyPrice(plan.quarterlyPrice);
      setYearlyPrice(plan.yearlyPrice);
    } else if (!selectedDApp) {
      setMonthlyPrice('');
      setQuarterlyPrice('');
      setYearlyPrice('');
    }
  }, [selectedDApp, plan]);

  const handleCreateOrUpdatePlan = async () => {
    if (!isConnected || !address) {
      alert('Please connect your wallet');
      return;
    }

    if (!selectedDApp || !selectedDApp.startsWith('0x')) {
      alert('Please select a dApp with a contract address');
      return;
    }

    if (!monthlyPrice || !quarterlyPrice || !yearlyPrice) {
      alert('Please enter all pricing tiers');
      return;
    }

    if (!dAppSubscriptionAddress) {
      alert('DAppSubscription contract not found. Please check your network connection.');
      return;
    }

    try {
      const monthlyWei = parseEther(monthlyPrice);
      const quarterlyWei = parseEther(quarterlyPrice);
      const yearlyWei = parseEther(yearlyPrice);

      if (plan) {
        // Update existing plan
        writeContract({
          address: dAppSubscriptionAddress as `0x${string}`,
          abi: DAPP_SUBSCRIPTION_ABI,
          functionName: 'updateSubscriptionPlan',
          args: [selectedDApp as `0x${string}`, monthlyWei, quarterlyWei, yearlyWei],
        });
      } else {
        // Create new plan
        writeContract({
          address: dAppSubscriptionAddress as `0x${string}`,
          abi: DAPP_SUBSCRIPTION_ABI,
          functionName: 'createSubscriptionPlan',
          args: [selectedDApp as `0x${string}`, monthlyWei, quarterlyWei, yearlyWei],
        });
      }
    } catch (err) {
      console.error('Error creating/updating subscription plan:', err);
    }
  };

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔐</div>
        <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          Connect Your Wallet
        </h3>
        <p className="text-zinc-600 dark:text-zinc-400">
          Please connect your wallet to manage subscriptions.
        </p>
      </div>
    );
  }

  if (dAppsWithContracts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔔</div>
        <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          No dApps with Contracts
        </h3>
        <p className="text-zinc-600 dark:text-zinc-400 mb-6">
          You need to register a dApp with a contract address to set up subscriptions.
        </p>
        <Link
          href="/u?tab=my-dapps&view=build-dapp"
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[#02abb8] rounded-lg hover:bg-[#0299a3] transition-colors"
        >
          Build a dApp
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
          Manage Subscription Plans
        </h3>
        <p className="kx-body mb-6">
          Configure subscription pricing for your dApps. Users can subscribe monthly, quarterly, or yearly.
        </p>
      </div>

      {/* Select dApp */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          Select dApp
        </label>
        <KxFormDropdown
          ariaLabel="Select dApp"
          value={selectedDApp || ''}
          placeholder="-- Select a dApp --"
          onChange={(next) => {
            setSelectedDApp(next || null);
            setMonthlyPrice('');
            setQuarterlyPrice('');
            setYearlyPrice('');
          }}
          options={[
            { value: '', label: '-- Select a dApp --' },
            ...dAppsWithContracts.map((dapp) => ({
              value: dapp.contractAddress || '',
              label: `${dapp.name} (${dapp.contractAddress?.slice(0, 10)}...)`,
            })),
          ]}
        />
      </div>

      {selectedDApp && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 space-y-4">
          {isLoadingPlan && (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#02abb8]"></div>
            </div>
          )}

          {plan && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400">
                ✓ Subscription plan exists. Update the prices below to modify it.
              </p>
            </div>
          )}

          {safeError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
              {safeError}
            </div>
          )}

          {isSuccess && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-600 dark:text-green-400">
              Subscription plan {plan ? 'updated' : 'created'} successfully!
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Monthly Price (KAS)
            </label>
            <input
              type="number"
              step="0.001"
              min="0"
              value={monthlyPrice}
              onChange={(e) => setMonthlyPrice(e.target.value)}
              placeholder="0.0"
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Quarterly Price (KAS)
            </label>
            <input
              type="number"
              step="0.001"
              min="0"
              value={quarterlyPrice}
              onChange={(e) => setQuarterlyPrice(e.target.value)}
              placeholder="0.0"
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8]"
            />
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Typically 10% discount from monthly × 3
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Yearly Price (KAS)
            </label>
            <input
              type="number"
              step="0.001"
              min="0"
              value={yearlyPrice}
              onChange={(e) => setYearlyPrice(e.target.value)}
              placeholder="0.0"
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8]"
            />
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Typically 20% discount from monthly × 12
            </p>
          </div>

          <button
            onClick={handleCreateOrUpdatePlan}
            disabled={isPending || isConfirming || !monthlyPrice || !quarterlyPrice || !yearlyPrice}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-[#02abb8] rounded-lg hover:bg-[#0299a3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending || isConfirming
              ? plan
                ? 'Updating...'
                : 'Creating...'
              : plan
              ? 'Update Plan'
              : 'Create Plan'}
          </button>
        </div>
      )}
    </div>
  );
}

