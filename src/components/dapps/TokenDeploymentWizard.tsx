/**
 * Token Deployment Wizard
 * Step-by-step UI for deploying dApp tokens
 */

'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useIPFSUpload } from '@/lib/ipfs/hooks';
import { validateTokenConfig, tokensToWei, calculateTokenAllocation, type TokenDeploymentConfig } from '@/lib/contracts/tokenDeployment';
import { DAPP_TOKEN_ABI } from '@/lib/contracts/abis';
import { getErrorMessage } from '@/lib/utils';

export interface TokenDeploymentWizardProps {
  dAppId: string;
  dAppName: string;
  onComplete?: (tokenAddress: string) => void;
  onCancel?: () => void;
}

export function TokenDeploymentWizard({
  dAppId,
  dAppName,
  onComplete,
  onCancel,
}: TokenDeploymentWizardProps) {
  const { address, isConnected } = useAccount();
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<TokenDeploymentConfig>({
    name: `${dAppName} Token`,
    symbol: dAppName.substring(0, 5).toUpperCase() + 'T',
    maxSupply: '1000000',
    rewardVault: '',
    liquidityReserve: '',
    treasury: '',
    devAddress: address || '',
    airdropAddress: address || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDeploying, setIsDeploying] = useState(false);

  const { writeContract, data: deployHash, isPending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash: deployHash,
  });

  const { uploadJSON, isUploading: isUploadingMetadata } = useIPFSUpload();

  const handleNext = () => {
    // Validate current step
    const validation = validateTokenConfig(config);
    if (!validation.valid) {
      setErrors({ general: validation.error || 'Invalid configuration' });
      return;
    }

    setErrors({});
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleDeploy();
    }
  };

  const handleDeploy = async () => {
    setIsDeploying(true);
    setErrors({});

    try {
      const maxSupplyWei = tokensToWei(config.maxSupply);
      const allocation = calculateTokenAllocation(maxSupplyWei);

      // Upload metadata to IPFS
      const metadata = {
        name: config.name,
        symbol: config.symbol,
        maxSupply: config.maxSupply,
        allocation,
        dAppId,
        dAppName,
        deployedAt: new Date().toISOString(),
      };

      const ipfsCID = await uploadJSON(metadata, { pin: true });
      if (!ipfsCID) {
        throw new Error('Failed to upload metadata to IPFS');
      }

      // Deploy token contract
      // Note: This requires the DAppToken contract bytecode
      // In a real implementation, you'd use a factory contract or deploy directly
      // For now, this is a placeholder structure

      // After deployment, call onComplete with token address
      // const tokenAddress = '0x...'; // From deployment
      // onComplete?.(tokenAddress);

    } catch (error) {
      console.error('Deployment failed:', error);
      setErrors({ general: getErrorMessage(error, 'Deployment failed') });
    } finally {
      setIsDeploying(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Connect wallet to deploy token
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          Deploy Token for {dAppName}
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Step {step} of 3: Configure your token
        </p>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="k-label">
              Token Name
            </label>
            <input
              type="text"
              value={config.name}
              onChange={(e) => setConfig({ ...config, name: e.target.value })}
              className="k-input"
              placeholder="My dApp Token"
            />
          </div>

          <div>
            <label className="k-label">
              Token Symbol
            </label>
            <input
              type="text"
              value={config.symbol}
              onChange={(e) => setConfig({ ...config, symbol: e.target.value.toUpperCase() })}
              className="k-input"
              placeholder="MDT"
              maxLength={10}
            />
          </div>

          <div>
            <label className="k-label">
              Max Supply (tokens)
            </label>
            <input
              type="number"
              value={config.maxSupply}
              onChange={(e) => setConfig({ ...config, maxSupply: e.target.value })}
              className="k-input"
              placeholder="1000000"
              min="1"
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
              Standard allocation: 80% Use-to-Mint, 10% Liquidity, 5% Treasury, 3% Dev, 2% Airdrops
            </p>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="k-label">
              Reward Vault Address
            </label>
            <input
              type="text"
              value={config.rewardVault}
              onChange={(e) => setConfig({ ...config, rewardVault: e.target.value })}
              className="k-input font-mono"
              placeholder="0x..."
            />
          </div>

          <div>
            <label className="k-label">
              Liquidity Reserve Address
            </label>
            <input
              type="text"
              value={config.liquidityReserve}
              onChange={(e) => setConfig({ ...config, liquidityReserve: e.target.value })}
              className="k-input font-mono"
              placeholder="0x..."
            />
          </div>

          <div>
            <label className="k-label">
              Treasury Address
            </label>
            <input
              type="text"
              value={config.treasury}
              onChange={(e) => setConfig({ ...config, treasury: e.target.value })}
              className="k-input font-mono"
              placeholder="0x..."
            />
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div>
            <label className="k-label">
              Dev/Maintenance Address
            </label>
            <input
              type="text"
              value={config.devAddress}
              onChange={(e) => setConfig({ ...config, devAddress: e.target.value })}
              className="k-input font-mono"
              placeholder="0x..."
            />
          </div>

          <div>
            <label className="k-label">
              Airdrop Address
            </label>
            <input
              type="text"
              value={config.airdropAddress}
              onChange={(e) => setConfig({ ...config, airdropAddress: e.target.value })}
              className="k-input font-mono"
              placeholder="0x..."
            />
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Review your configuration before deploying. Token deployment is irreversible.
            </p>
          </div>
        </div>
      )}

      {errors.general && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-300">{errors.general}</p>
        </div>
      )}

      <div className="flex gap-3">
        {step > 1 && (
          <button
            onClick={() => setStep(step - 1)}
            className="flex-1 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg transition-colors"
          >
            Back
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={isDeploying || isPending || isConfirming || isUploadingMetadata}
          className="flex-1 px-4 py-2 bg-[#02abb8] hover:bg-[#0199a3] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {step === 3
            ? isDeploying || isPending || isConfirming || isUploadingMetadata
              ? 'Deploying...'
              : 'Deploy Token'
            : 'Next'}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

