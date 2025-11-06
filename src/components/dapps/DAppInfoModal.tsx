'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { DApp } from '@/lib/dapps';
import { useDeployerProfile, formatDeployerName, getDeployerProfileUrl } from '@/lib/dapps/deployer';
import { Avatar } from '@/components/Avatar';
import { useDAppFromContract } from '@/lib/dapps/contractData';
import { useChainId } from 'wagmi';

interface DAppInfoModalProps {
  dapp: DApp;
  contractAddress?: string;
  onClose: () => void;
}

export function DAppInfoModal({ dapp, contractAddress, onClose }: DAppInfoModalProps) {
  const chainId = useChainId();
  
  // Get contract data for deployer info
  const { data: contractData } = useDAppFromContract(
    contractAddress && contractAddress.startsWith('0x') ? contractAddress : undefined,
    chainId
  );

  // Get deployer info
  const DEFAULT_DEPLOYER = '0x658420Fd88dbd610249a88384f9B1aD387F797c7';
  const deployerAddress = contractData?.deployerAddress || 
    dapp.deployerAddress || 
    (dapp.developer && dapp.developer.startsWith('0x') ? dapp.developer : '') || 
    DEFAULT_DEPLOYER;
  const { profile: deployerProfile } = useDeployerProfile(deployerAddress || undefined);
  const deployerName = formatDeployerName(deployerAddress, deployerProfile);
  const deployerUrl = getDeployerProfileUrl(deployerAddress);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Check if there's any content to show
  const hasContent = dapp.description || dapp.utility || dapp.process || dapp.benefits;
  if (!hasContent) {
    return null;
  }

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-zinc-200 dark:border-zinc-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
          <div className="flex items-start justify-between mb-6">
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
              {dapp.name}
            </h2>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Developer Info Section - At Top */}
          <div className="mb-6 pb-6 border-b border-zinc-200 dark:border-zinc-800">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Developer</h3>
            <div className="flex items-center gap-3 mb-3">
              <Avatar address={deployerAddress} size={40} />
              <div>
                <a
                  href={deployerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-base font-medium text-zinc-900 dark:text-zinc-100 hover:text-[#02abb8] transition-colors"
                >
                  {deployerName}
                </a>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 font-mono">
                  {deployerAddress.slice(0, 6)}...{deployerAddress.slice(-4)}
                </p>
              </div>
            </div>
            
            {/* Social Links */}
            {dapp.developerLinks && dapp.developerLinks.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {dapp.developerLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                  >
                    {link.label.toLowerCase().includes('twitter') || link.label.toLowerCase().includes('x') ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                    ) : link.label.toLowerCase().includes('telegram') ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                      </svg>
                    ) : link.label.toLowerCase().includes('website') || link.label.toLowerCase().includes('web') ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                    ) : null}
                    <span>{link.label}</span>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Content Sections */}
          <div className="space-y-6">
            {/* Description */}
            {dapp.description && (
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Description</h3>
                <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line">
                  {dapp.description}
                </p>
              </div>
            )}

            {/* Utility */}
            {dapp.utility && (
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Utility</h3>
                <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line">
                  {dapp.utility}
                </p>
              </div>
            )}

            {/* Process */}
            {dapp.process && (
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">How It Works</h3>
                <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line">
                  {dapp.process}
                </p>
              </div>
            )}

            {/* Benefits */}
            {dapp.benefits && (
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Benefits</h3>
                <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line">
                  {dapp.benefits}
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="px-5 py-3 bg-[#02abb8] text-white rounded-lg hover:bg-[#0299a3] transition-colors font-medium text-base"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof window === 'undefined') {
    return null;
  }

  return createPortal(modalContent, document.body);
}

