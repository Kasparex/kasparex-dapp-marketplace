'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { DApp } from '@/lib/dapps';
import { ContractDAppData } from '@/lib/dapps/contractData';
import { DAPP_REGISTRY_ABI } from '@/lib/contracts/abis';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { useTreasuryPayment } from '@/hooks/useTreasuryPayment';

interface EditDAppModalProps {
  dapp: DApp;
  contractAddress?: string;
  contractData?: ContractDAppData | null;
  onClose: () => void;
}

export function EditDAppModal({ dapp, contractAddress, contractData, onClose }: EditDAppModalProps) {
  const { address: connectedAddress, isConnected } = useAccount();
  const chainId = useChainId();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [name, setName] = useState(dapp.name);
  const [version, setVersion] = useState(dapp.version || '');
  const [description, setDescription] = useState(dapp.description || '');
  const [utility, setUtility] = useState(dapp.utility || '');
  const [process, setProcess] = useState(dapp.process || '');
  const [benefits, setBenefits] = useState(dapp.benefits || '');
  const [website, setWebsite] = useState(dapp.developerLinks?.find(l => l.label.toLowerCase().includes('website'))?.url || '');
  const [twitter, setTwitter] = useState(dapp.developerLinks?.find(l => l.label.toLowerCase().includes('twitter') || l.label.toLowerCase().includes('x'))?.url || '');
  const [telegram, setTelegram] = useState(dapp.developerLinks?.find(l => l.label.toLowerCase().includes('telegram'))?.url || '');
  const [security, setSecurity] = useState(dapp.security || '');
  const [roadmap, setRoadmap] = useState(dapp.roadmap || '');

  // Get DAppRegistry address
  const dAppRegistryAddress = 
    chainId === 202555 
      ? (CONTRACT_ADDRESSES?.kasplexL2Mainnet?.DAppRegistry || '')
      : chainId === 167012
      ? (CONTRACT_ADDRESSES?.kasplexL2Testnet?.DAppRegistry || '')
      : '';

  // Use Treasury payment hook
  const {
    pay: payTreasuryFee,
    isPaying: isFeePending,
    isConfirming: isFeeConfirming,
    isSuccess: isFeeSuccess,
    txHash: feeTxHash,
    error: treasuryError,
    treasuryAddress,
    isTreasuryAvailable,
  } = useTreasuryPayment({
    amount: '10',
    onSuccess: (txHash) => {
      console.log('Treasury fee paid successfully:', txHash);
    },
    onError: (error) => {
      console.error('Treasury payment error:', error);
      setError(error.message);
      setIsSubmitting(false);
    },
  });

  // Write contract for DAppRegistry update
  const { writeContract: writeRegistryContract, data: updateTxHash, isPending: isUpdatePending } = useWriteContract();
  const { isLoading: isUpdateConfirming, isSuccess: isUpdateSuccess } = useWaitForTransactionReceipt({
    hash: updateTxHash,
  });

  // Check if on-chain data changed
  const onChainDataChanged = 
    name !== (contractData?.name || dapp.name) ||
    version !== (contractData?.version || dapp.version || '');

  // Handle fee payment success
  useEffect(() => {
    if (isFeeSuccess && feeTxHash) {
      // Small delay to ensure state is updated
      setTimeout(() => {
        const resolvedContractAddr = contractAddress || dapp.contractAddress || '';
        if (onChainDataChanged && dAppRegistryAddress && resolvedContractAddr) {
          // Fee paid, now update DAppRegistry
          handleUpdateContract();
        } else if (!onChainDataChanged) {
          // Fee paid, no contract update needed, just save frontend data
          handleSaveFrontendData();
        }
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFeeSuccess, feeTxHash]);

  // Handle contract update success
  useEffect(() => {
    if (isUpdateSuccess) {
      handleSaveFrontendData();
    }
  }, [isUpdateSuccess]);

  const handleUpdateContract = async () => {
    // Validate contract addresses
    if (!dAppRegistryAddress || dAppRegistryAddress.trim() === '') {
      setError('DAppRegistry address not available');
      setIsSubmitting(false);
      return;
    }

    // Use contractAddress prop or fallback to dapp.contractAddress
    const resolvedContractAddress = contractAddress || dapp.contractAddress || '';
    
    if (!resolvedContractAddress || resolvedContractAddress.trim() === '') {
      setError('Contract address not available');
      setIsSubmitting(false);
      return;
    }

    // Validate all required fields
    if (!name || typeof name !== 'string' || name.trim() === '') {
      setError('Name is required');
      setIsSubmitting(false);
      return;
    }

    if (!version || typeof version !== 'string' || version.trim() === '') {
      setError('Version is required');
      setIsSubmitting(false);
      return;
    }

    if (!dapp.category || typeof dapp.category !== 'string') {
      setError('Category is required');
      setIsSubmitting(false);
      return;
    }

    try {
      // Get category from current dApp - ensure it's a string
      const category = String(dapp.category || '').trim();
      const nameStr = String(name || '').trim();
      const versionStr = String(version || '').trim();
      
      // Validate contract address format
      const contractAddr = resolvedContractAddress.trim();
      if (!contractAddr || typeof contractAddr !== 'string' || !contractAddr.startsWith('0x') || contractAddr.length !== 42) {
        setError('Invalid contract address format');
        setIsSubmitting(false);
        return;
      }

      // Validate DAppRegistry address format
      if (!dAppRegistryAddress || typeof dAppRegistryAddress !== 'string' || !dAppRegistryAddress.startsWith('0x') || dAppRegistryAddress.length !== 42) {
        setError('Invalid DAppRegistry address format');
        setIsSubmitting(false);
        return;
      }
      
      // Call registerDApp with new version (or updateDApp if exists)
      // Note: DAppRegistry may need an updateDApp function, for now we'll use registerDApp
      await writeRegistryContract({
        address: dAppRegistryAddress as `0x${string}`,
        abi: DAPP_REGISTRY_ABI,
        functionName: 'registerDApp',
        args: [nameStr, versionStr, category, contractAddr as `0x${string}`],
      });
    } catch (err: any) {
      console.error('Error updating contract:', err);
      const errorMessage = err?.message || err?.toString() || 'Failed to update contract';
      setError(errorMessage);
      setIsSubmitting(false);
    }
  };

  const handleSaveFrontendData = () => {
    try {
      // Save frontend metadata to localStorage
      const frontendData = {
        description,
        utility,
        process,
        benefits,
        security,
        roadmap,
        developerLinks: [
          website && { label: 'Website', url: website },
          twitter && { label: 'Twitter', url: twitter },
          telegram && { label: 'Telegram', url: telegram },
        ].filter(Boolean),
      };

      const key = `dapp_${dapp.id}_metadata`;
      localStorage.setItem(key, JSON.stringify(frontendData));

      setSuccess(true);
      setTimeout(() => {
        onClose();
        window.location.reload(); // Reload to show updated data
      }, 1500);
    } catch (err) {
      console.error('Error saving frontend data:', err);
      setError('Failed to save frontend data');
    }
  };

  const handleSubmit = async () => {
    if (!isConnected || !connectedAddress) {
      setError('Please connect your wallet');
      return;
    }

    if (!isTreasuryAvailable) {
      setError('Treasury address not available for this network');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      // Pay 10 KAS fee to Treasury using the hook
      await payTreasuryFee();
    } catch (err: any) {
      console.error('Error paying fee:', err);
      setError(err.message || 'Failed to pay fee');
      setIsSubmitting(false);
    }
  };

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose, isSubmitting]);

  const isLoading = isSubmitting || isFeePending || isFeeConfirming || isUpdatePending || isUpdateConfirming;

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={!isLoading ? onClose : undefined}
    >
      <div
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            Edit {dapp.name}
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4">
          {(error || treasuryError) && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
              {error || treasuryError}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-600 dark:text-green-400 text-sm">
              Changes saved successfully!
            </div>
          )}

          {/* On-chain fields */}
          <div className="space-y-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              On-Chain Data (Requires Contract Update)
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Version
              </label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="e.g., 1.0.0"
                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Frontend-only fields */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              Frontend Metadata
            </h3>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Utility
              </label>
              <textarea
                value={utility}
                onChange={(e) => setUtility(e.target.value)}
                rows={4}
                placeholder="What is the utility of this dApp?"
                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Process (How It Works)
              </label>
              <textarea
                value={process}
                onChange={(e) => setProcess(e.target.value)}
                rows={4}
                placeholder="How does this dApp work?"
                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Benefits
              </label>
              <textarea
                value={benefits}
                onChange={(e) => setBenefits(e.target.value)}
                rows={4}
                placeholder="What are the benefits of using this dApp?"
                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Website
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Twitter/X
              </label>
              <input
                type="url"
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                placeholder="https://x.com/username"
                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Telegram
              </label>
              <input
                type="url"
                value={telegram}
                onChange={(e) => setTelegram(e.target.value)}
                placeholder="https://t.me/username"
                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Security
              </label>
              <textarea
                value={security}
                onChange={(e) => setSecurity(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Roadmap
              </label>
              <textarea
                value={roadmap}
                onChange={(e) => setRoadmap(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Fee Info */}
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-sm text-zinc-600 dark:text-zinc-400">
            <p className="font-medium mb-1">Edit Fee: 10 KAS</p>
            <p>This fee will be sent to the Treasury contract to support platform development.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 sm:p-6 border-t border-zinc-200 dark:border-zinc-800">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !isConnected}
            className="px-4 py-2 text-sm font-medium text-white bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : 'Save Changes (10 KAS)'}
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof window === 'undefined') {
    return null;
  }

  return createPortal(modalContent, document.body);
}

