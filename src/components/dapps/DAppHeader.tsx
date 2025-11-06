'use client';

import { useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { DApp } from '@/lib/dapps';
import { isDeployer } from '@/lib/dapps/deployer';
import { EditDAppModal } from './EditDAppModal';
import { useDAppFromContract } from '@/lib/dapps/contractData';
import { getContractAddress } from '@/lib/contracts/addresses';

interface DAppHeaderProps {
  dapp: DApp;
  contractAddress?: string;
}

export function DAppHeader({ dapp, contractAddress }: DAppHeaderProps) {
  const { address: connectedAddress } = useAccount();
  const chainId = useChainId();
  
  // Get contract address if not provided
  // Try to get from SimplePayment contract address for Simple Payment dApp
  let resolvedContractAddress = contractAddress || dapp.contractAddress || '';
  if (!resolvedContractAddress && dapp.slug === 'simple-payment') {
    try {
      resolvedContractAddress = getContractAddress(chainId, 'SimplePayment') || '';
    } catch (e) {
      console.warn('Could not get SimplePayment contract address');
    }
  }
  
  // Fetch contract data
  const { data: contractData } = useDAppFromContract(
    resolvedContractAddress && resolvedContractAddress.startsWith('0x') ? resolvedContractAddress : undefined,
    chainId
  );

  // Get deployer info
  const deployerAddress = contractData?.deployerAddress || dapp.deployerAddress || dapp.developer || '';
  const isDeployerUser = isDeployer(connectedAddress, deployerAddress);

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);

  return (
    <>
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 sm:p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          {/* Left side: Title */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              {contractData?.name || dapp.name}
            </h1>
          </div>

          {/* Right side: Edit Button (Deployers only) */}
          {isDeployerUser && (
            <div className="flex-shrink-0">
              <button
                onClick={() => setShowEditModal(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
              >
                Edit
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showEditModal && (
        <EditDAppModal
          dapp={dapp}
          contractAddress={resolvedContractAddress}
          contractData={contractData}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </>
  );
}

