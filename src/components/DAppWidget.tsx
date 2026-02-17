'use client';

import { useState, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { DApp } from '@/lib/dapps';
import { NetworkCompatibilityModal } from './NetworkCompatibilityModal';
import { useNetworkCompatibility } from '@/hooks/useNetworkCompatibility';
import { useNetworkAwareWallet } from '@/hooks/useNetworkAwareWallet';
import { NetworkInfoMessage } from './NetworkInfoMessage';
import { SimplePaymentWidget } from './dapps/SimplePaymentWidget';
import { getDAppNetworkType } from '@/lib/dapps';
import { DAOVotingWidget } from './dapps/DAOVotingWidget';
import { SendKASWidget } from './dapps/SendKASWidget';
import { SendKREXWidget } from './dapps/SendKREXWidget';
import { GenesisDappWidget } from './dapps/GenesisDappWidget';
import { DAppWidgetHeader } from './dapps/DAppWidgetHeader';
import { DAppWidgetFooter } from './dapps/DAppWidgetFooter';
import { getContractAddress } from '@/lib/contracts/addresses';

interface DAppWidgetProps {
  dapp: DApp;
  hideHeader?: boolean;
  hideFooter?: boolean;
  hideIcons?: boolean;
  hideStar?: boolean;
  hideHeart?: boolean;
  hideInfo?: boolean;
  hideEmbed?: boolean;
  accentColor?: string;
}

export function DAppWidget({ 
  dapp,
  hideHeader = false,
  hideFooter = false,
  hideIcons = false,
  hideStar = false,
  hideHeart = false,
  hideInfo = false,
  hideEmbed = false,
  accentColor = '#02abb8',
}: DAppWidgetProps) {
  const [showModal, setShowModal] = useState(false);
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const compatibility = useNetworkCompatibility(dapp);
  const networkWallet = useNetworkAwareWallet(dapp);
  const isL1DApp = getDAppNetworkType(dapp) === 'L1';

  const handleModalClose = () => {
    setShowModal(false);
  };

  const handleInteraction = () => {
    // Show modal only when user tries to interact with incompatible dApp
    if (!compatibility.isCompatible) {
      setShowModal(true);
    }
  };

  // Get contract address (only for L2 dApps)
  let contractAddress = '';
  if (!isL1DApp) {
    contractAddress = dapp.contractAddress || '';
    if (!contractAddress && dapp.slug === 'simple-payment') {
      try {
        contractAddress = getContractAddress(chainId, 'SimplePayment') || '';
      } catch (e) {
        console.warn('Could not get SimplePayment contract address');
      }
    }
    if (!contractAddress && dapp.slug === 'dao-voting') {
      try {
        contractAddress = getContractAddress(chainId, 'DAOVoting') || '';
      } catch (e) {
        console.warn('Could not get DAOVoting contract address');
      }
    }
  }

  // Render SimplePayment widget if it's the Simple Payment dApp
  if (dapp.slug === 'simple-payment' || dapp.id === '11') {
    return (
      <>
        <NetworkCompatibilityModal
          dapp={dapp}
          isOpen={showModal}
          onClose={handleModalClose}
        />
        {!networkWallet.isCorrectWalletConnected && (
          <NetworkInfoMessage 
            networkType={networkWallet.networkType}
            message={networkWallet.message}
            className="mb-4"
          />
        )}
        <div className={`w-full bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden ${!compatibility.isCompatible && isConnected ? 'opacity-60' : ''}`}>
          {!hideHeader && (
            <div className={!compatibility.isCompatible && isConnected ? 'pointer-events-auto' : ''}>
              <DAppWidgetHeader 
                dapp={dapp} 
                contractAddress={contractAddress}
                hideIcons={hideIcons}
                hideStar={hideStar}
                hideHeart={hideHeart}
                hideInfo={hideInfo}
                hideEmbed={hideEmbed}
                accentColor={accentColor}
              />
            </div>
          )}
          <div className={!compatibility.isCompatible && isConnected ? 'pointer-events-none' : ''}>
            <SimplePaymentWidget />
          </div>
          {!hideFooter && (
            <div className={!compatibility.isCompatible && isConnected ? 'pointer-events-none' : ''}>
              <DAppWidgetFooter dapp={dapp} contractAddress={isL1DApp ? undefined : contractAddress} hideIcons={hideIcons} hideStar={hideStar} hideHeart={hideHeart} hideEmbed={hideEmbed} hideMetaRow={hideHeader} />
            </div>
          )}
        </div>
      </>
    );
  }

  // Render DAOVoting widget if it's the DAO Voting dApp
  if (dapp.slug === 'dao-voting') {
    return (
      <>
        <NetworkCompatibilityModal
          dapp={dapp}
          isOpen={showModal}
          onClose={handleModalClose}
        />
        {!networkWallet.isCorrectWalletConnected && (
          <NetworkInfoMessage 
            networkType={networkWallet.networkType}
            message={networkWallet.message}
            className="mb-4"
          />
        )}
        <div className={`w-full bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden ${!compatibility.isCompatible && isConnected ? 'opacity-60' : ''}`}>
          {!hideHeader && (
            <div className={!compatibility.isCompatible && isConnected ? 'pointer-events-auto' : ''}>
              <DAppWidgetHeader 
                dapp={dapp} 
                contractAddress={contractAddress}
                hideIcons={hideIcons}
                hideStar={hideStar}
                hideHeart={hideHeart}
                hideInfo={hideInfo}
                hideEmbed={hideEmbed}
                accentColor={accentColor}
              />
            </div>
          )}
          <div className={!compatibility.isCompatible && isConnected ? 'pointer-events-none' : ''}>
            <DAOVotingWidget />
          </div>
          {!hideFooter && (
            <div className={!compatibility.isCompatible && isConnected ? 'pointer-events-none' : ''}>
              <DAppWidgetFooter dapp={dapp} contractAddress={isL1DApp ? undefined : contractAddress} hideIcons={hideIcons} hideStar={hideStar} hideHeart={hideHeart} hideEmbed={hideEmbed} hideMetaRow={hideHeader} />
            </div>
          )}
        </div>
      </>
    );
  }

  // Render Genesis Dapp widget if it's the Genesis Dapp
  if (dapp.slug === 'genesis-dapp') {
    return (
      <>
        <NetworkCompatibilityModal
          dapp={dapp}
          isOpen={showModal}
          onClose={handleModalClose}
        />
        <div className={`w-full bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden`}>
          {!hideHeader && (
            <DAppWidgetHeader 
              dapp={dapp} 
              contractAddress={undefined}
              hideIcons={hideIcons}
              hideStar={hideStar}
              hideHeart={hideHeart}
              hideInfo={hideInfo}
              hideEmbed={hideEmbed}
              accentColor={accentColor}
            />
          )}
          <GenesisDappWidget />
          {!hideFooter && (
            <DAppWidgetFooter 
              dapp={dapp} 
              contractAddress={undefined} 
              hideIcons={hideIcons} 
              hideStar={hideStar} 
              hideHeart={hideHeart} 
              hideEmbed={hideEmbed}
              hideMetaRow={hideHeader}
            />
          )}
        </div>
      </>
    );
  }

  // Render SendKREX widget if it's the Send KREX dApp
  if (dapp.slug === 'send-krex' || dapp.id === '16') {
    return (
      <>
        <NetworkCompatibilityModal
          dapp={dapp}
          isOpen={showModal}
          onClose={handleModalClose}
        />
        {!networkWallet.isCorrectWalletConnected && (
          <NetworkInfoMessage 
            networkType={networkWallet.networkType}
            message={networkWallet.message}
            className="mb-4"
          />
        )}
        <div className={`w-full bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden ${!compatibility.isCompatible && isConnected ? 'opacity-60' : ''}`}>
          {!hideHeader && (
            <div className={!compatibility.isCompatible && isConnected ? 'pointer-events-auto' : ''}>
              <DAppWidgetHeader 
                dapp={dapp} 
                contractAddress={contractAddress}
                hideIcons={hideIcons}
                hideStar={hideStar}
                hideHeart={hideHeart}
                hideInfo={hideInfo}
                hideEmbed={hideEmbed}
                accentColor={accentColor}
              />
            </div>
          )}
          <div className={!compatibility.isCompatible && isConnected ? 'pointer-events-none' : ''}>
            <SendKREXWidget />
          </div>
          {!hideFooter && (
            <div className={!compatibility.isCompatible && isConnected ? 'pointer-events-none' : ''}>
              <DAppWidgetFooter dapp={dapp} contractAddress={isL1DApp ? undefined : contractAddress} hideIcons={hideIcons} hideStar={hideStar} hideHeart={hideHeart} hideEmbed={hideEmbed} hideMetaRow={hideHeader} />
            </div>
          )}
        </div>
      </>
    );
  }

  // Render SendKAS widget if it's the Send KAS dApp
  if (dapp.slug === 'send-kas' || dapp.id === '15') {
    return (
      <>
        <NetworkCompatibilityModal
          dapp={dapp}
          isOpen={showModal}
          onClose={handleModalClose}
        />
        {!networkWallet.isCorrectWalletConnected && (
          <NetworkInfoMessage 
            networkType={networkWallet.networkType}
            message={networkWallet.message}
            className="mb-4"
          />
        )}
        <div className={`w-full bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden ${!compatibility.isCompatible && isConnected ? 'opacity-60' : ''}`}>
          {!hideHeader && (
            <div className={!compatibility.isCompatible && isConnected ? 'pointer-events-auto' : ''}>
              <DAppWidgetHeader 
                dapp={dapp} 
                contractAddress={contractAddress}
                hideIcons={hideIcons}
                hideStar={hideStar}
                hideHeart={hideHeart}
                hideInfo={hideInfo}
                hideEmbed={hideEmbed}
                accentColor={accentColor}
              />
            </div>
          )}
          
          {/* Big dApp Title - Under Header */}
          <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              {dapp.name}
            </h1>
          </div>
          
          <div className={!compatibility.isCompatible && isConnected ? 'pointer-events-none' : ''}>
            <SendKASWidget />
          </div>
          {!hideFooter && (
            <div className={!compatibility.isCompatible && isConnected ? 'pointer-events-none' : ''}>
              <DAppWidgetFooter dapp={dapp} contractAddress={isL1DApp ? undefined : contractAddress} hideIcons={hideIcons} hideStar={hideStar} hideHeart={hideHeart} hideEmbed={hideEmbed} hideMetaRow={hideHeader} />
            </div>
          )}
        </div>
      </>
    );
  }


  if (!dapp.widgetUrl) {
    return (
      <>
        <NetworkCompatibilityModal
          dapp={dapp}
          isOpen={showModal}
          onClose={handleModalClose}
        />
        
        <div className="w-full bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          {!hideHeader && (
            <DAppWidgetHeader 
              dapp={dapp} 
              contractAddress={contractAddress}
              hideIcons={hideIcons}
              hideStar={hideStar}
              hideHeart={hideHeart}
              hideInfo={hideInfo}
              hideEmbed={hideEmbed}
              accentColor={accentColor}
            />
          )}
          <div 
            className="flex flex-col items-center justify-center min-h-[400px] p-8 cursor-pointer"
            onClick={handleInteraction}
          >
            <div className="text-center max-w-md">
              <svg
                className="mx-auto h-16 w-16 text-zinc-400 dark:text-zinc-600 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                Widget Coming Soon
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                The interactive widget for {dapp.name} will be available here once it&apos;s deployed.
              </p>
              {!isConnected && (
                <p className="text-sm text-zinc-500 dark:text-zinc-500 mb-4">
                  Connect your EVM wallet to use this dApp when it&apos;s ready.
                </p>
              )}
              {dapp.url && (
                <a
                  href={dapp.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    if (!compatibility.isCompatible) {
                      e.preventDefault();
                      handleInteraction();
                    }
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                >
                  Launch App in New Tab
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              )}
            </div>
          </div>
          {!hideFooter && (
            <DAppWidgetFooter dapp={dapp} contractAddress={contractAddress} hideIcons={hideIcons} hideStar={hideStar} hideHeart={hideHeart} hideEmbed={hideEmbed} hideMetaRow={hideHeader} />
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <NetworkCompatibilityModal
        dapp={dapp}
        isOpen={showModal}
        onClose={handleModalClose}
      />
      {!networkWallet.isCorrectWalletConnected && (
        <NetworkInfoMessage 
          networkType={networkWallet.networkType}
          message={networkWallet.message}
          className="mb-4"
        />
      )}
        <div className={`w-full bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden ${!compatibility.isCompatible && isConnected ? 'opacity-60' : ''}`}>
          {!hideHeader && (
            <div className={!compatibility.isCompatible && isConnected ? 'pointer-events-auto' : ''}>
              <DAppWidgetHeader 
                dapp={dapp} 
                contractAddress={contractAddress}
                hideIcons={hideIcons}
                hideStar={hideStar}
                hideHeart={hideHeart}
                hideInfo={hideInfo}
                hideEmbed={hideEmbed}
                accentColor={accentColor}
              />
            </div>
          )}
          
          {/* Big dApp Title - Under Header */}
          <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              {dapp.name}
            </h1>
          </div>
          <div 
            className={`relative w-full overflow-hidden ${!compatibility.isCompatible && isConnected ? 'pointer-events-none' : ''}`}
            style={{ minHeight: '600px' }}
            onClick={handleInteraction}
          >
          <iframe
            src={dapp.widgetUrl}
            className="w-full h-full border-0"
            style={{ minHeight: '600px', height: '100%' }}
            title={`${dapp.name} Widget`}
            allow="clipboard-read; clipboard-write"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          />
        </div>
        
        {/* Optional: Launch in new tab link */}
        {dapp.url && (
          <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 text-center">
            <a
              href={dapp.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              Open in new tab
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          </div>
        )}
        {!hideFooter && (
          <div className={!compatibility.isCompatible && isConnected ? 'pointer-events-none' : ''}>
            <DAppWidgetFooter dapp={dapp} contractAddress={contractAddress} hideIcons={hideIcons} hideStar={hideStar} hideHeart={hideHeart} hideEmbed={hideEmbed} hideMetaRow={hideHeader} />
          </div>
        )}
      </div>
    </>
  );
}

