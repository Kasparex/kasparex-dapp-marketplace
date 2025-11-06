'use client';

import { useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { DApp } from '@/lib/dapps';
import { getCategoryById } from '@/lib/categories';
import { isDeployer, useDeployerProfile, formatDeployerName, getDeployerProfileUrl } from '@/lib/dapps/deployer';
import { Avatar } from '@/components/Avatar';
import { EditDAppModal } from './EditDAppModal';
import { DAppInfoModal } from './DAppInfoModal';
import { DAppAdditionalInfoModal } from './DAppAdditionalInfoModal';
import { DAppEmbed } from './DAppEmbed';
import { useDAppFromContract } from '@/lib/dapps/contractData';
import { getContractAddress } from '@/lib/contracts/addresses';

interface DAppWidgetHeaderProps {
  dapp: DApp;
  contractAddress?: string;
}

export function DAppWidgetHeader({ dapp, contractAddress }: DAppWidgetHeaderProps) {
  const { address: connectedAddress } = useAccount();
  const chainId = useChainId();
  const category = getCategoryById(dapp.category);
  
  // Get contract address if not provided
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

  // Get deployer info - prioritize wallet addresses over display names
  // Only use dapp.developer if it's a wallet address (starts with 0x)
  const deployerAddress = contractData?.deployerAddress || 
    dapp.deployerAddress || 
    (dapp.developer && dapp.developer.startsWith('0x') ? dapp.developer : '') || 
    '';
  const { profile: deployerProfile } = useDeployerProfile(
    deployerAddress || undefined
  );
  const deployerName = formatDeployerName(deployerAddress, deployerProfile);
  const deployerUrl = getDeployerProfileUrl(deployerAddress);
  const isDeployerUser = isDeployer(connectedAddress, deployerAddress);

  // Version from contract or frontend
  const version = contractData?.version || dapp.version || 'N/A';

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showAdditionalInfoModal, setShowAdditionalInfoModal] = useState(false);
  const [showEmbedModal, setShowEmbedModal] = useState(false);

  return (
    <>
      <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-start justify-between gap-4">
          {/* Left side: Category, Version, Deployer with labels */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Category */}
              {category && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">Category:</span>
                  <a
                    href={`/?category=${dapp.category}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                  >
                    <span>{category.emoji}</span>
                    <span>{category.name}</span>
                  </a>
                </div>
              )}

              {/* Version */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">Version:</span>
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  v{version}
                </span>
              </div>

              {/* Deployer Info */}
              {deployerAddress && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">Developer:</span>
                  <div className="flex items-center gap-2">
                    <Avatar address={deployerAddress} size={20} />
                    <a
                      href={deployerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                    >
                      {deployerName}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right side: Icons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Info Icon */}
            {dapp.description && (
              <button
                onClick={() => setShowInfoModal(true)}
                className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                title="Description"
                aria-label="View description"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            )}

            {/* Additional Info Icon */}
            {(dapp.security || dapp.roadmap) && (
              <button
                onClick={() => setShowAdditionalInfoModal(true)}
                className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                title="Additional Information"
                aria-label="View additional information"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
            )}

            {/* Embed Icon */}
            <button
              onClick={() => setShowEmbedModal(true)}
              className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              title="Embed"
              aria-label="Get embed code"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>

            {/* Edit Button (Deployers only) */}
            {isDeployerUser && (
              <button
                onClick={() => setShowEditModal(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
              >
                Edit
              </button>
            )}
          </div>
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
      {showInfoModal && (
        <DAppInfoModal
          dapp={dapp}
          onClose={() => setShowInfoModal(false)}
        />
      )}
      {showAdditionalInfoModal && (
        <DAppAdditionalInfoModal
          dapp={dapp}
          onClose={() => setShowAdditionalInfoModal(false)}
        />
      )}
      {showEmbedModal && (
        <DAppEmbed
          dapp={dapp}
          onClose={() => setShowEmbedModal(false)}
        />
      )}
    </>
  );
}

