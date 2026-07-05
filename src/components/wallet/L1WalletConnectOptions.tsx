'use client';

import { useState } from 'react';
import { KASPA_WALLET_PROVIDERS } from '@/lib/kaspa/wallet';
import {
  getMobileWalletInstallUrl,
  isMobileUserAgent,
  mobileWalletConnectHint,
} from '@/lib/kaspa/mobileWallet';
import { useKaspaProviderProbe } from '@/hooks/useKaspaProviderProbe';
import { L1WalletConnectLabel, type L1WalletProviderId } from '@/components/wallet/L1WalletLogo';
import { useIsMobileViewport } from '@/hooks/useIsMobileViewport';
import { MobileWalletUnavailableNotice } from '@/components/hub/MobileWalletUnavailableNotice';

type ConnectableProvider = L1WalletProviderId;

export interface L1WalletConnectOptionsProps {
  onConnect: (provider: ConnectableProvider) => Promise<void>;
  connecting: ConnectableProvider | null;
  error?: string | null;
  /** Mobile: show Kastle first (recommended for dApps). */
  mobileKastleFirst?: boolean;
  compact?: boolean;
}

function providerInstalled(
  provider: ConnectableProvider,
  isInstalled: (id: string) => boolean,
): boolean {
  if (provider === 'kasware') {
    return isInstalled('kasware') || (typeof window !== 'undefined' && !!(window as Window & { kasware?: unknown }).kasware);
  }
  return isInstalled('kastle') || (typeof window !== 'undefined' && !!(window as Window & { kastle?: unknown }).kastle);
}

export function L1WalletConnectOptions({
  onConnect,
  connecting,
  error,
  mobileKastleFirst = true,
  compact = false,
}: L1WalletConnectOptionsProps) {
  const { isInstalled } = useKaspaProviderProbe();
  const isMobile = useIsMobileViewport();
  const isMobileUa = isMobileUserAgent();
  const [hintProvider, setHintProvider] = useState<ConnectableProvider | null>(null);

  const ordered = mobileKastleFirst && (isMobile || isMobileUa)
    ? (['kastle', 'kasware'] as const)
    : (['kasware', 'kastle'] as const);

  const handleAction = async (provider: ConnectableProvider) => {
    const installed = providerInstalled(provider, isInstalled);
    if (installed) {
      setHintProvider(null);
      await onConnect(provider);
      return;
    }

    if (isMobile || isMobileUa) {
      setHintProvider(provider);
      window.open(getMobileWalletInstallUrl(provider), '_blank', 'noopener,noreferrer');
      return;
    }

    const url =
      KASPA_WALLET_PROVIDERS[provider].downloadUrl ??
      KASPA_WALLET_PROVIDERS[provider].documentationUrl;
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  const btnClass = compact
    ? 'w-full px-3 py-2 text-left text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-60'
    : 'w-full flex items-center justify-between gap-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-colors disabled:opacity-60';

  return (
    <div className="space-y-2">
      {isMobile || isMobileUa ? (
        <MobileWalletUnavailableNotice networks="L1" />
      ) : null}

      {!(isMobile || isMobileUa)
        ? ordered.map((provider) => {
        const installed = providerInstalled(provider, isInstalled);
        const label = installed
          ? `Connect ${KASPA_WALLET_PROVIDERS[provider].name}`
          : isMobile || isMobileUa
            ? `Get ${KASPA_WALLET_PROVIDERS[provider].name}`
            : `Install ${KASPA_WALLET_PROVIDERS[provider].name}`;

        return (
          <button
            key={provider}
            type="button"
            onClick={() => void handleAction(provider)}
            disabled={connecting !== null}
            className={btnClass}
          >
            <L1WalletConnectLabel provider={provider} label={label} logoSize={compact ? 20 : 22} />
            {!compact ? (
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 shrink-0">
                {connecting === provider ? 'Connecting…' : installed ? 'L1' : isMobile || isMobileUa ? 'App' : 'Install'}
              </span>
            ) : null}
          </button>
        );
      })
        : null}

      {connecting ? (
        <p className="px-1 text-xs text-zinc-500">Connecting…</p>
      ) : null}

      {hintProvider ? (
        <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/5 px-3 py-2 text-xs leading-snug text-zinc-600 dark:text-zinc-300">
          {mobileWalletConnectHint(hintProvider)}
        </div>
      ) : null}

      {error ? <p className="text-xs text-red-600 dark:text-red-400 px-0.5">{error}</p> : null}
    </div>
  );
}
