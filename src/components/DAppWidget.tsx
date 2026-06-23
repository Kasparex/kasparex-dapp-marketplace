'use client';

import { useMemo, useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { DApp, getDAppNetworkType, isDAppCompatibleWithChain } from '@/lib/dapps';
import { SimplePaymentWidget } from './dapps/SimplePaymentWidget';
import { DAOVotingWidget } from './dapps/DAOVotingWidget';
import { SendKASWidget } from './dapps/SendKASWidget';
import { SendKREXWidget } from './dapps/SendKREXWidget';
import { GenesisDappWidget } from './dapps/GenesisDappWidget';
import { CovenantLockboxWidget } from './dapps/CovenantLockboxWidget';
import { CovenantSplitWidget } from './dapps/CovenantSplitWidget';
import { CovenantMilestoneWidget } from './dapps/CovenantMilestoneWidget';
import { CovenantCrowdfundWidget } from './dapps/CovenantCrowdfundWidget';
import { CovenantVoucherWidget } from './dapps/CovenantVoucherWidget';
import { GenesisBadgeWidget } from './dapps/GenesisBadgeWidget';
import { DAppWidgetHeader } from './dapps/DAppWidgetHeader';
import { DAppWidgetFooter } from './dapps/DAppWidgetFooter';
import { getDAppContractAddress } from '@/lib/dapps/contractResolver';
import { DAppWalletGateModal } from './dapps/DAppWalletGateModal';
import { useDAppAccess } from '@/hooks/useDAppAccess';

interface DAppWidgetProps {
  dapp: DApp;
  hideHeader?: boolean;
  hideFooter?: boolean;
  /** When true, footer does not show category/version/ID row (e.g. on dApp detail page where right column has it). */
  hideFooterMetaRow?: boolean;
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
  hideFooterMetaRow = false,
  hideIcons = false,
  hideStar = false,
  hideHeart = false,
  hideInfo = false,
  hideEmbed = false,
  accentColor = '#02abb8',
}: DAppWidgetProps) {
  const { isConnected: isEvmConnected } = useAccount();
  const networkType = getDAppNetworkType(dapp);
  const chainId = useChainId();
  const [showGateModal, setShowGateModal] = useState(false);
  const isL1DApp = networkType === 'L1';

  let contractAddress = '';
  if (!isL1DApp) {
    contractAddress = dapp.contractAddress || getDAppContractAddress(dapp, chainId) || '';
  }

  const isL2ChainCompatible = useMemo(() => {
    if (networkType !== 'L2') return true;
    if (!isEvmConnected || chainId === undefined) return false;
    return isDAppCompatibleWithChain(dapp, chainId);
  }, [networkType, isEvmConnected, chainId, dapp]);

  const isContractMissingOnThisNetwork =
    networkType === 'L2' &&
    isEvmConnected &&
    chainId !== undefined &&
    isL2ChainCompatible &&
    (!contractAddress || !contractAddress.startsWith('0x'));

  const { isOpenable } = useDAppAccess({
    dapp,
    isContractMissingOnNetwork: isContractMissingOnThisNetwork,
  });

  const isBlocked = !isOpenable || isContractMissingOnThisNetwork;

  const handleBlockedInteraction = () => {
    if (isBlocked) {
      setShowGateModal(true);
    }
  };

  const renderShell = (inner: React.ReactNode, resolvedContractAddress?: string) => {
    const cardClass = 'w-full bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden';

    return (
      <div className="relative">
        <DAppWalletGateModal
          dapp={dapp}
          isOpen={showGateModal}
          onClose={() => setShowGateModal(false)}
          isContractMissingOnNetwork={isContractMissingOnThisNetwork}
        />
        <div
          className={cardClass}
          onClick={isBlocked ? handleBlockedInteraction : undefined}
          onKeyDown={
            isBlocked
              ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleBlockedInteraction();
                  }
                }
              : undefined
          }
          role={isBlocked ? 'button' : undefined}
          tabIndex={isBlocked ? 0 : undefined}
        >
          {!hideHeader ? (
            <div className={isBlocked ? 'pointer-events-none' : ''}>
              <DAppWidgetHeader
                dapp={dapp}
                contractAddress={resolvedContractAddress}
                hideIcons={hideIcons}
                hideStar={hideStar}
                hideHeart={hideHeart}
                hideInfo={hideInfo}
                hideEmbed={hideEmbed}
                accentColor={accentColor}
              />
            </div>
          ) : null}

          <div className={isBlocked ? 'pointer-events-none' : ''}>{inner}</div>

          {!hideFooter ? (
            <div className={isBlocked ? 'pointer-events-none' : ''}>
              <DAppWidgetFooter
                dapp={dapp}
                contractAddress={resolvedContractAddress}
                hideIcons={hideIcons}
                hideStar={hideStar}
                hideHeart={hideHeart}
                hideEmbed={hideEmbed}
                hideMetaRow={hideFooterMetaRow || hideHeader}
              />
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  // Render SimplePayment widget if it's the Simple Payment dApp
  if (dapp.slug === 'simple-payment' || dapp.id === '11') {
    return renderShell(<SimplePaymentWidget />, isL1DApp ? undefined : contractAddress);
  }

  // Render DAOVoting widget if it's the DAO Voting dApp
  if (dapp.slug === 'dao-voting') {
    return renderShell(<DAOVotingWidget />, isL1DApp ? undefined : contractAddress);
  }

  // Render Genesis Badge widget if it's the Genesis Badge dApp
  if (dapp.slug === 'genesis-badge') {
    return renderShell(<GenesisBadgeWidget dapp={dapp} />, contractAddress);
  }

  // Render Genesis Dapp widget if it's the Genesis Dapp
  if (dapp.slug === 'genesis-dapp') {
    return renderShell(<GenesisDappWidget />, undefined);
  }

  if (dapp.slug === 'covenant-lab') {
    return renderShell(<CovenantLockboxWidget />, undefined);
  }

  if (dapp.slug === 'covenant-split') {
    return renderShell(<CovenantSplitWidget />, undefined);
  }

  if (dapp.slug === 'covenant-milestone') {
    return renderShell(<CovenantMilestoneWidget />, undefined);
  }

  if (dapp.slug === 'covenant-crowdfund') {
    return renderShell(<CovenantCrowdfundWidget />, undefined);
  }

  if (dapp.slug === 'covenant-voucher') {
    return renderShell(<CovenantVoucherWidget />, undefined);
  }

  // Render SendKREX widget if it's the Send KREX dApp
  if (dapp.slug === 'send-krex' || dapp.id === '16') {
    return renderShell(<SendKREXWidget />, isL1DApp ? undefined : contractAddress);
  }

  // Render SendKAS widget if it's the Send KAS dApp
  if (dapp.slug === 'send-kas' || dapp.id === '15') {
    return renderShell(<SendKASWidget />, isL1DApp ? undefined : contractAddress);
  }


  if (!dapp.widgetUrl) {
    const comingSoon = (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
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
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Widget Coming Soon</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            The interactive widget for {dapp.name} will be available here once it&apos;s deployed.
          </p>
        </div>
      </div>
    );
    return renderShell(comingSoon, contractAddress);
  }

  const iframe = (
    <div className="relative w-full overflow-hidden" style={{ minHeight: '600px' }}>
      <iframe
        src={dapp.widgetUrl}
        className="w-full h-full border-0"
        style={{ minHeight: '600px', height: '100%' }}
        title={`${dapp.name} Widget`}
        allow="clipboard-read; clipboard-write"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
      />

      {dapp.url ? (
        <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 text-center">
          <a
            href={dapp.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            Open in new tab
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>
      ) : null}
    </div>
  );
  return renderShell(iframe, contractAddress);
}
