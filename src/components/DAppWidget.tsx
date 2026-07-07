'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { DApp, getDAppNetworkType, isDAppCompatibleWithChain } from '@/lib/dapps';
import { DAppWidgetHeader } from './dapps/DAppWidgetHeader';
import { DAppWidgetFooter } from './dapps/DAppWidgetFooter';
import { getDAppContractAddress } from '@/lib/dapps/contractResolver';
import { getDAppBlockedOverlayMessage, getDAppGateOverlaySubtitle } from '@/lib/dapps/access';
import { getDAppAvailableChainNames } from '@/lib/dapps/contractResolver';
import { DAppWalletGateModal } from './dapps/DAppWalletGateModal';
import { DAppNetworkBadge } from './dapps/DAppNetworkBadge';
import { HubWalletGateOverlay } from '@/components/hub/HubWalletGateOverlay';
import { HUB_GATE_FRAME_CLASS } from '@/lib/hub/gateFrame';
import { KX_WIDGET_DETAIL_PANEL } from '@/lib/hub/shellTokens';
import { useDAppAccess } from '@/hooks/useDAppAccess';
import { useDAppWalletGate } from '@/hooks/useDAppWalletGate';
import { resolveWidgetEntry } from '@/lib/dapps/widgetRegistry';

interface DAppWidgetProps {
  dapp: DApp;
  variant?: 'detail' | 'embed' | 'card';
  hideHeader?: boolean;
  hideFooter?: boolean;
  hideFooterMetaRow?: boolean;
  hideIcons?: boolean;
  hideStar?: boolean;
  hideHeart?: boolean;
  hideInfo?: boolean;
  hideEmbed?: boolean;
  accentColor?: string;
  autoPromptWhenBlocked?: boolean;
}

export function DAppWidget({
  dapp,
  variant = 'card',
  hideHeader = false,
  hideFooter = false,
  hideFooterMetaRow = false,
  hideIcons = false,
  hideStar = false,
  hideHeart = false,
  hideInfo = false,
  hideEmbed = false,
  accentColor = '#02abb8',
  autoPromptWhenBlocked = false,
}: DAppWidgetProps) {
  const { isConnected: isEvmConnected } = useAccount();
  const networkType = getDAppNetworkType(dapp);
  const chainId = useChainId();
  const [autoPrompted, setAutoPrompted] = useState(false);
  const { l1Modal, closeL1Modal, promptGate } = useDAppWalletGate();
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

  const { isOpenable, gateReason, requiredChainNames } = useDAppAccess({
    dapp,
    isContractMissingOnNetwork: isContractMissingOnThisNetwork,
  });

  const isBlocked = !isOpenable || isContractMissingOnThisNetwork;

  const gateOptions = {
    isContractMissingOnNetwork: isContractMissingOnThisNetwork,
  };

  const effectiveGateReason =
    isContractMissingOnThisNetwork && networkType === 'L2' ? 'l2_chain_mismatch' : gateReason;

  const handleBlockedInteraction = () => {
    if (isBlocked) {
      promptGate(dapp, { isOpenable: false, gateReason: effectiveGateReason }, gateOptions);
    }
  };

  const availableChainNames = useMemo(() => getDAppAvailableChainNames(dapp), [dapp]);

  useEffect(() => {
    if (l1Modal && !isBlocked) closeL1Modal();
  }, [l1Modal, isBlocked, closeL1Modal]);

  useEffect(() => {
    if (!autoPromptWhenBlocked || !isBlocked || autoPrompted) return;
    setAutoPrompted(true);
    if (effectiveGateReason === 'l2_chain_mismatch' || effectiveGateReason === 'contract_missing') return;
    promptGate(dapp, { isOpenable: false, gateReason: effectiveGateReason }, gateOptions);
  }, [autoPromptWhenBlocked, autoPrompted, dapp, effectiveGateReason, isBlocked, promptGate, isContractMissingOnThisNetwork]);

  const widgetEntry = resolveWidgetEntry(dapp);
  const isDetail = variant === 'detail';
  const effectiveHideHeader = hideHeader || isDetail;
  const effectiveHideFooter = hideFooter || isDetail;

  const inner = widgetEntry ? (
    <widgetEntry.component dapp={dapp} />
  ) : dapp.widgetUrl ? (
    <div className="relative w-full overflow-hidden" style={{ minHeight: isDetail ? '400px' : '600px' }}>
      <iframe
        src={dapp.widgetUrl}
        className="w-full h-full border-0"
        style={{ minHeight: isDetail ? '400px' : '600px', height: '100%' }}
        title={`${dapp.name} Widget`}
        allow="clipboard-read; clipboard-write"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
      />
    </div>
  ) : (
    <div className={`flex flex-col items-center justify-center p-6 sm:p-8 ${isDetail ? 'min-h-[280px]' : 'min-h-[400px]'}`}>
      <div className="text-center max-w-md">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Widget Coming Soon</h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          The interactive widget for {dapp.name} will be available here once it&apos;s deployed.
        </p>
      </div>
    </div>
  );

  const gateOverlay = isBlocked ? (
    <HubWalletGateOverlay
      badge={<DAppNetworkBadge dapp={dapp} preferRequired size="md" />}
      title={getDAppBlockedOverlayMessage(effectiveGateReason, dapp, requiredChainNames)}
      availableNetworks={availableChainNames}
      subtitle={getDAppGateOverlaySubtitle(effectiveGateReason)}
      onClick={handleBlockedInteraction}
    />
  ) : null;

  const widgetBody = (
    <>
      {l1Modal ? (
        <DAppWalletGateModal
          dapp={l1Modal.dapp}
          isOpen
          onClose={closeL1Modal}
          selectedNetwork={l1Modal.selectedNetwork}
        />
      ) : null}
      <div className={isBlocked ? 'pointer-events-none' : ''}>{inner}</div>
    </>
  );

  if (isDetail) {
    return (
      <div className={isBlocked ? HUB_GATE_FRAME_CLASS : `relative ${KX_WIDGET_DETAIL_PANEL}`}>
        {widgetBody}
        {gateOverlay}
      </div>
    );
  }

  const cardClass =
    'w-full bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden';

  return (
    <div className={isBlocked ? HUB_GATE_FRAME_CLASS : 'relative overflow-hidden rounded-xl'}>
      <div className={cardClass}>
        {!effectiveHideHeader ? (
          <div className={isBlocked ? 'pointer-events-none' : ''}>
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
        ) : null}
        {widgetBody}
        {!effectiveHideFooter ? (
          <div className={isBlocked ? 'pointer-events-none' : ''}>
            <DAppWidgetFooter
              dapp={dapp}
              contractAddress={contractAddress}
              hideIcons={hideIcons}
              hideStar={hideStar}
              hideHeart={hideHeart}
              hideEmbed={hideEmbed}
              hideMetaRow={hideFooterMetaRow || effectiveHideHeader}
            />
          </div>
        ) : null}
      </div>
      {gateOverlay}
    </div>
  );
}
