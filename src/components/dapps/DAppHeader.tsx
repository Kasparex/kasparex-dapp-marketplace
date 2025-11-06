'use client';

import { useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { DApp } from '@/lib/dapps';
import { isDeployer } from '@/lib/dapps/deployer';
import { EditDAppModal } from './EditDAppModal';
import { DAppInfoModal } from './DAppInfoModal';
import { DAppAdditionalInfoModal } from './DAppAdditionalInfoModal';
import { DAppEmbed } from './DAppEmbed';
import { useDAppFromContract } from '@/lib/dapps/contractData';
import { getContractAddress } from '@/lib/contracts/addresses';
import { useNetworkCompatibility } from '@/hooks/useNetworkCompatibility';

interface DAppHeaderProps {
  dapp: DApp;
  contractAddress?: string;
}

export function DAppHeader({ dapp, contractAddress }: DAppHeaderProps) {
  const { address: connectedAddress } = useAccount();
  const chainId = useChainId();
  const compatibility = useNetworkCompatibility(dapp);
  
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

  // Get deployer info - prioritize wallet addresses over display names
  // Only use dapp.developer if it's a wallet address (starts with 0x)
  const deployerAddress = contractData?.deployerAddress || 
    dapp.deployerAddress || 
    (dapp.developer && dapp.developer.startsWith('0x') ? dapp.developer : '') || 
    '';
  const isDeployerUser = isDeployer(connectedAddress, deployerAddress);

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showAdditionalInfoModal, setShowAdditionalInfoModal] = useState(false);
  const [showEmbedModal, setShowEmbedModal] = useState(false);

  return (
    <>
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          {/* Left side: Title and Description */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              {contractData?.name || dapp.name}
            </h1>
            {(dapp.description || dapp.utility) && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {dapp.description || dapp.utility}
              </p>
            )}
          </div>

          {/* Right side: Icons, Network Info, and Edit Button */}
          <div className="flex items-start gap-3 flex-shrink-0">
            {/* Network Info Box */}
            {compatibility.isWalletConnected && (
              <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3 border border-zinc-200 dark:border-zinc-700">
                <div className="text-xs space-y-1">
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-400">Current:</span>{' '}
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {compatibility.currentChainName || 'Unknown'}
                    </span>
                  </div>
                  {!compatibility.isCompatible && (
                    <div>
                      <span className="text-zinc-500 dark:text-zinc-400">Required:</span>{' '}
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {compatibility.requiredChainNames.length > 0
                          ? compatibility.requiredChainNames.join(' or ')
                          : 'Unknown'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Icons */}
            <div className="flex items-center gap-2">
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

