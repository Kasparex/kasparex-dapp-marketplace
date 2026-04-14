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

  const overlayTitle =
    networkType === 'L1'
      ? 'Available on L1'
      : !isEvmConnected
        ? 'Available on L2'
        : !isL2ChainCompatible
          ? 'Wrong network'
          : 'Available on L2';

  const overlaySubtitle =
    networkType === 'L1'
      ? isKaspaConnected
        ? ''
        : 'Connect your (L1) wallet to open.'
      : !isEvmConnected
        ? 'Connect your EVM (L2) wallet to open.'
        : chainId === undefined
          ? 'Connect your EVM (L2) wallet to a supported network.'
          : !isL2ChainCompatible
            ? `Switch to ${requiredChainNames.join(' or ')}.`
            : '';

  const envBadgeClassName = useMemo(() => {
    if (statusType === 'testnet') {
      return 'bg-amber-500/15 text-amber-900 dark:text-amber-200 border-amber-500/25';
    }
    if (statusType === 'mainnet') {
      return networkType === 'L1'
        ? 'bg-emerald-500/15 text-emerald-900 dark:text-emerald-200 border-emerald-500/25'
        : 'bg-cyan-500/15 text-cyan-900 dark:text-cyan-200 border-cyan-500/25';
    }
    if (statusType === 'suspended') {
      return 'bg-red-500/15 text-red-900 dark:text-red-200 border-red-500/25';
    }
    return 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/20';
  }, [statusType, networkType]);

  const badges: Array<{ label: string; className: string }> = [
    networkType === 'L1'
      ? { label: 'L1', className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/25' }
      : { label: 'L2', className: 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/25' },
    ...(statusLabel
      ? [
          {
            label: statusLabel.toUpperCase(),
            className: envBadgeClassName,
          },
        ]
      : []),
  ];

  const renderShell = (inner: React.ReactNode, resolvedContractAddress?: string) => {
    const cardClass = `w-full bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden ${!isOpenable ? 'opacity-95' : ''}`;

    return (
    <div className="relative">
      <NetworkCompatibilityModal
        dapp={dapp}
        isOpen={showCompatibilityModal}
        onClose={() => setShowCompatibilityModal(false)}
      />
      <div className={cardClass}>
        {!hideHeader ? (
          <div className={!isOpenable ? 'pointer-events-none' : ''}>
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

        <div className={!isOpenable ? 'pointer-events-none' : ''}>{inner}</div>

        {!hideFooter ? (
          <div className={!isOpenable ? 'pointer-events-none' : ''}>
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
        className={`pointer-events-none absolute inset-0 z-30 flex flex-col justify-between rounded-xl border border-cyan-500/40 bg-white/80 dark:bg-zinc-950/75 px-6 py-6 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.14)] backdrop-blur-md ${
          isOpenable ? 'hidden' : 'opacity-100'
        }`}
        aria-hidden
      >
        <div className="flex flex-wrap items-center gap-2">
          {badges.slice(0, 3).map((b) => (
            <span
              key={b.label}
              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${b.className}`}
            >
              {b.label}
            </span>
          ))}
        </div>

        <div className="flex flex-col items-center justify-center flex-1 text-center">
          <p className="text-base sm:text-lg font-black uppercase tracking-[0.12em] text-zinc-900 dark:text-zinc-50 drop-shadow-sm">
            {overlayTitle}
          </p>
          {overlaySubtitle ? (
            <p className="mt-3 text-sm sm:text-base leading-relaxed text-zinc-700 dark:text-zinc-200/95 max-w-md mx-auto font-semibold">
              {overlaySubtitle}
            </p>
          ) : null}
        </div>

        <p className="text-center text-[11px] font-black uppercase tracking-[0.22em] text-zinc-600 dark:text-zinc-300">
          {dapp.network}
        </p>
      </div>
    </div>
  );};

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

