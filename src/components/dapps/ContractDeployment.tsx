'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { DApp } from '@/lib/dapps';
import { DAPP_REGISTRY_ABI } from '@/lib/contracts/abis';
import { getContractAddress, CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { useChainId } from 'wagmi';
import { parseEther } from 'viem';
import { getErrorMessage } from '@/lib/utils';
import { useSafeError } from '@/hooks/useSafeError';
import { hubNotify } from '@/lib/hub/notify';

interface ContractStepProps {
  formData: Partial<DApp>;
  onUpdate: (updates: Partial<DApp>) => void;
}

export function ContractStep({ formData, onUpdate }: ContractStepProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [contractAddress, setContractAddress] = useState(formData.contractAddress || '');
  const [isRegistering, setIsRegistering] = useState(false);

  // Get DAppRegistry address
  const dAppRegistryAddress = (() => {
    try {
      if (typeof getContractAddress === 'function') {
        return getContractAddress(chainId, 'DAppRegistry') || '';
      }
    } catch (e) {
      console.warn('getContractAddress not available, using fallback');
    }

    if (CONTRACT_ADDRESSES) {
      if (chainId === 202555 && CONTRACT_ADDRESSES.kasplexL2Mainnet) {
        return CONTRACT_ADDRESSES.kasplexL2Mainnet.DAppRegistry || '';
      } else if (chainId === 167012 && CONTRACT_ADDRESSES.kasplexL2Testnet) {
        return CONTRACT_ADDRESSES.kasplexL2Testnet.DAppRegistry || '';
      }
    }
    return '';
  })();

  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });
  
  // Safely convert error to string immediately
  const safeError = useSafeError(error);

  const handleRegister = async () => {
    if (!isConnected || !address) {
      hubNotify.error('Wallet required', 'Please connect your wallet');
      return;
    }

    if (!contractAddress || !contractAddress.startsWith('0x')) {
      hubNotify.warning('Invalid address', 'Please enter a valid contract address');
      return;
    }

    if (!formData.name || !formData.category) {
      hubNotify.warning('Incomplete form', 'Please complete the Basic Info step first');
      return;
    }

    if (!dAppRegistryAddress) {
      hubNotify.error(
        'Contract missing',
        'DAppRegistry contract not found. Please check your network connection.',
      );
      return;
    }

    setIsRegistering(true);

    try {
      writeContract({
        address: dAppRegistryAddress as `0x${string}`,
        abi: DAPP_REGISTRY_ABI,
        functionName: 'registerDApp',
        args: [
          formData.name || '',
          formData.version || '1.0',
          formData.category || 'general',
          contractAddress as `0x${string}`,
        ],
      });
    } catch (err) {
      console.error('Error registering dApp:', err);
      setIsRegistering(false);
    }
  };

  // Update form data when registration succeeds
  if (isSuccess && contractAddress) {
    onUpdate({ contractAddress });
    setIsRegistering(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
          Smart Contract
        </h3>
        <p className="kx-body mb-6">
          Link your existing smart contract or deploy a new one. Registration is optional but recommended for on-chain verification.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          Contract Address (Optional)
        </label>
        <input
          type="text"
          value={contractAddress}
          onChange={(e) => {
            setContractAddress(e.target.value);
            onUpdate({ contractAddress: e.target.value });
          }}
          placeholder="0x..."
          className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8] font-mono text-sm"
        />
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Enter the address of your deployed smart contract. Leave empty if you don&apos;t have a contract yet.
        </p>
      </div>

      {contractAddress && contractAddress.startsWith('0x') && (
        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
            Register on DAppRegistry
          </h4>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-4">
            Register your dApp on-chain to enable on-chain verification and integration with the marketplace.
          </p>
          
          {safeError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
              {safeError}
            </div>
          )}

          {isSuccess && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-600 dark:text-green-400">
              dApp registered successfully! Transaction: {hash?.slice(0, 10)}...
            </div>
          )}

          <button
            onClick={handleRegister}
            disabled={isPending || isConfirming || isRegistering || isSuccess || !formData.name}
            className="px-4 py-2 text-sm font-medium text-white bg-[#02abb8] rounded-lg hover:bg-[#0299a3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending || isConfirming || isRegistering
              ? 'Registering...'
              : isSuccess
              ? 'Registered'
              : 'Register on DAppRegistry'}
          </button>
        </div>
      )}

      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
          💡 Tips
        </h4>
        <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
          <li>You can skip this step and add a contract address later</li>
          <li>Contract registration enables on-chain verification</li>
          <li>Make sure your contract is deployed on the correct network</li>
          <li>You can update the contract address after submission</li>
        </ul>
      </div>
    </div>
  );
}

