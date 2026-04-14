'use client';

import { useMemo, useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { DApp, getDAppChainIds, getDAppNetworkType, isDAppCompatibleWithChain } from '@/lib/dapps';
import { SimplePaymentWidget } from './dapps/SimplePaymentWidget';
import { DAOVotingWidget } from './dapps/DAOVotingWidget';
import { SendKASWidget } from './dapps/SendKASWidget';
import { SendKREXWidget } from './dapps/SendKREXWidget';
import { GenesisDappWidget } from './dapps/GenesisDappWidget';
import { GenesisBadgeWidget } from './dapps/GenesisBadgeWidget';
import { DAppWidgetHeader } from './dapps/DAppWidgetHeader';
import { DAppWidgetFooter } from './dapps/DAppWidgetFooter';
import { getDAppContractAddress } from '@/lib/dapps/contractResolver';
import { getChainById } from '@/lib/wagmi';
import { NetworkCompatibilityModal } from './NetworkCompatibilityModal';

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
  const { state: kaspaState } = useKaspaWallet();
  const isKaspaConnected = kaspaState.isConnected;
  const networkType = getDAppNetworkType(dapp);
  const chainId = useChainId();
  const [showCompatibilityModal, setShowCompatibilityModal] = useState(false);
  const isL1DApp = networkType === 'L1';

  let contractAddress = '';
  if (!isL1DApp) {
    contractAddress = dapp.contractAddress || getDAppContractAddress(dapp, chainId) || '';
  }

  const requiredChainIds = useMemo(() => getDAppChainIds(dapp), [dapp]);
  const requiredChainNames = useMemo(
    () => requiredChainIds.map((id) => getChainById(id)?.name || `Chain ${id}`),
    [requiredChainIds]
  );

  const isTestnetDApp = useMemo(() => {
    return (
      dapp.status?.toLowerCase() === 'testnet' ||
      dapp.network?.toLowerCase().includes('testnet') ||
      dapp.network?.toLowerCase().includes('galleon') ||
      dapp.name?.toLowerCase().includes('testnet')
    );
  }, [dapp.name, dapp.network, dapp.status]);

  const statusLabel = useMemo(() => {
    const status = (dapp.status || '').toLowerCase();
    const env = status === 'testnet' || isTestnetDApp ? 'Testnet' : status === 'mainnet' ? 'Mainnet' : dapp.status;
    if (env === 'Suspended') return 'Suspended';

    if (networkType === 'L2') {
      const lower = (dapp.network || '').toLowerCase();
      const family = lower.includes('igra') ? 'Igra' : lower.includes('kasplex') ? 'Kasplex' : 'L2';
      return `${family} ${env}`;
    }

    const lower = (dapp.network || '').toLowerCase();
    const family = lower.includes('kaspa') ? 'Kaspa' : 'L1';
    return `${family} ${env}`;
  }, [dapp.network, dapp.status, isTestnetDApp, networkType]);

  const statusType: 'mainnet' | 'testnet' | 'suspended' | 'none' = useMemo(() => {
    const status = (dapp.status || '').toLowerCase();
    if (status === 'suspended') return 'suspended';
    if (status === 'testnet' || isTestnetDApp) return 'testnet';
    if (status === 'mainnet') return 'mainnet';
    return 'none';
  }, [dapp.status, isTestnetDApp]);

  const isL2ChainCompatible = useMemo(() => {
    if (networkType !== 'L2') return true;
    if (!isEvmConnected || chainId === undefined) return false;
    return isDAppCompatibleWithChain(dapp, chainId);
  }, [networkType, isEvmConnected, chainId, dapp]);

  const isOpenable =
    networkType === 'L1'
      ? isKaspaConnected
      : isEvmConnected && chainId !== undefined && isL2ChainCompatible;

  const isContractMissingOnThisNetwork =
    networkType === 'L2' &&
    isEvmConnected &&
    chainId !== undefined &&
    isL2ChainCompatible &&
    (!contractAddress || !contractAddress.startsWith('0x'));

  const overlayMessage = isContractMissingOnThisNetwork
    ? 'Contract not deployed on this network'
    : networkType === 'L1'
      ? !isKaspaConnected
        ? 'Connect L1 Wallet'
        : ''
      : !isEvmConnected
        ? 'Connect L2 Wallet'
        : chainId === undefined || !isL2ChainCompatible
          ? `Switch to ${requiredChainNames.join(' or ')}`
          : '';

  const primaryRequiredChainName = useMemo(() => {
    const unique = Array.from(new Set(requiredChainNames));
    if (unique.length === 0) return '';
    const score = (name: string) => {
      const n = name.toLowerCase();
      if (n.includes('mainnet')) return 0;
      if (n.includes('testnet')) return 2;
      return 1;
    };
    return [...unique].sort((a, b) => score(a) - score(b) || a.localeCompare(b))[0] || unique[0];
  }, [requiredChainNames]);

  const activeChain = useMemo(() => (chainId ? getChainById(chainId) : null), [chainId]);

  const badgeNetworkLabel = useMemo(() => {
    if (networkType === 'L2') {
      if (isEvmConnected && chainId !== undefined && isL2ChainCompatible) {
        return activeChain?.name || `Chain ${chainId}`;
      }
      return primaryRequiredChainName || dapp.network || 'L2';
    }

    const nice = statusLabel || (networkType === 'L1' ? 'Kaspa' : dapp.network ? dapp.network : 'L1');
    return nice.replace(/^(L1|L2)\s+/i, '');
  }, [
    activeChain?.name,
    chainId,
    dapp.network,
    isEvmConnected,
    isL2ChainCompatible,
    networkType,
    primaryRequiredChainName,
    statusLabel,
  ]);

  const badgeKind = useMemo(() => {
    if (networkType === 'L1') {
      const lower = badgeNetworkLabel.toLowerCase();
      if (lower.includes('kaspa') && lower.includes('mainnet')) return 'kaspa_mainnet';
      if (
        lower.includes('kaspa') &&
        (lower.includes('testnet') || lower.includes('vprogs') || lower.includes('simulator'))
      )
        return 'kaspa_testnet';
      return statusType === 'testnet' ? 'kaspa_testnet' : statusType === 'mainnet' ? 'kaspa_mainnet' : 'neutral';
    }

    if (networkType === 'L2') {
      if (isEvmConnected && chainId !== undefined && isL2ChainCompatible) {
        return activeChain?.testnet ? 'l2_testnet' : 'l2_mainnet';
      }
      const lower = badgeNetworkLabel.toLowerCase();
      if (lower.includes('testnet')) return 'l2_testnet';
      if (lower.includes('mainnet')) return 'l2_mainnet';
      return statusType === 'testnet' ? 'l2_testnet' : statusType === 'mainnet' ? 'l2_mainnet' : 'neutral';
    }

    return 'neutral';
  }, [
    activeChain?.testnet,
    badgeNetworkLabel,
    chainId,
    isEvmConnected,
    isL2ChainCompatible,
    networkType,
    statusType,
  ]);

  const topBadgeClassName = useMemo(() => {
    if (badgeKind === 'kaspa_mainnet') {
      return 'bg-cyan-500/10 text-[#028f9a] dark:text-[#70C7BA] border border-cyan-500/25';
    }
    if (badgeKind === 'kaspa_testnet') {
      return 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border border-zinc-300/40 dark:border-zinc-700/60';
    }
    if (badgeKind === 'l2_testnet') {
      return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border border-yellow-300/50 dark:border-yellow-600/40';
    }
    if (badgeKind === 'l2_mainnet') {
      return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border border-emerald-300/50 dark:border-emerald-600/40';
    }
    if (statusType === 'suspended') {
      return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-300/50 dark:border-red-600/40';
    }
    return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300/50 dark:border-zinc-700/60';
  }, [badgeKind, statusType]);

  const renderShell = (inner: React.ReactNode, resolvedContractAddress?: string) => {
    const isBlocked = !isOpenable || isContractMissingOnThisNetwork;
    const cardClass = `w-full bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden ${isBlocked ? 'opacity-95' : ''}`;

    return (
    <div className="relative">
      <NetworkCompatibilityModal
        dapp={dapp}
        isOpen={showCompatibilityModal}
        onClose={() => setShowCompatibilityModal(false)}
      />
      <div className={cardClass}>
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

      {/* Full-widget gating overlay (no hover) */}
      <div
        className={`absolute inset-0 z-30 flex flex-col justify-between rounded-xl border border-zinc-900/10 bg-white dark:border-white/10 dark:bg-zinc-950 px-6 py-6 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.14)] ${
          !isOpenable || isContractMissingOnThisNetwork ? 'opacity-100' : 'hidden'
        }`}
        aria-hidden
      >
        <div className="flex items-start">
          <span className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg shadow-sm ${topBadgeClassName}`}>
            {networkType === 'L1' ? 'L1' : 'L2'}
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
            </svg>
            {badgeNetworkLabel}
          </span>
        </div>

        <div className="flex flex-col items-center justify-center flex-1 text-center">
          <p className="text-sm sm:text-base font-black uppercase tracking-[0.16em] text-zinc-900 dark:text-zinc-50 drop-shadow-sm">
            {overlayMessage}
          </p>
        </div>

        <p className="text-center text-[11px] font-semibold tracking-wide text-zinc-600 dark:text-zinc-300">
          {badgeNetworkLabel}
        </p>
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

