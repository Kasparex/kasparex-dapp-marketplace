'use client';

import { useState } from 'react';
import { KASPA_WALLET_PROVIDERS } from '@/lib/kaspa/wallet';
import {
  getMobileWalletInstallUrl,
  isMobileUserAgent,
  mobileWalletConnectHint,
} from '@/lib/kaspa/mobileWallet';
import { useKaspaProviderProbe } from '@/hooks/useKaspaProviderProbe';
import {
  L1WalletConnectBadge,
  L1WalletConnectLabel,
  type L1WalletProviderId,
} from '@/components/wallet/L1WalletLogo';
import { useIsMobileViewport } from '@/hooks/useIsMobileViewport';
import { MobileWalletUnavailableNotice } from '@/components/hub/MobileWalletUnavailableNotice';
import { KaspirePairingModal } from '@/components/wallet/KaspirePairingModal';
import {
  cancelKaspirePairing,
  isIosUserAgent,
  KASPIRE_DOWNLOAD_URL,
} from '@/lib/kaspa/kaspireWc';

type ConnectableProvider = L1WalletProviderId;

export interface L1WalletConnectOptionsProps {
  onConnect: (
    provider: ConnectableProvider,
    options?: { onPairingUri?: (uri: string) => void },
  ) => Promise<void>;
  connecting: ConnectableProvider | null;
  error?: string | null;
  /** Called immediately when the Kaspire pairing modal is dismissed (before the async connect settles). */
  onPairingCancel?: () => void;
  /** Mobile: show Kastle first (recommended for in-app browsers). Kaspire stays available for WC. */
  mobileKastleFirst?: boolean;
  compact?: boolean;
}

function providerInstalled(
  provider: ConnectableProvider,
  isInstalled: (id: string) => boolean,
): boolean {
  if (provider === 'kaspire') return true;
  if (provider === 'kasware') {
    return isInstalled('kasware') || (typeof window !== 'undefined' && !!(window as Window & { kasware?: unknown }).kasware);
  }
  return isInstalled('kastle') || (typeof window !== 'undefined' && !!(window as Window & { kastle?: unknown }).kastle);
}

function providerSideLabel(
  provider: ConnectableProvider,
  connecting: ConnectableProvider | null,
  installed: boolean,
  isMobile: boolean,
): string {
  if (connecting === provider) return 'Connecting…';
  if (provider === 'kaspire') return 'Beta';
  return installed ? 'L1' : isMobile ? 'App' : 'Install';
}

export function L1WalletConnectOptions({
  onConnect,
  connecting,
  error,
  onPairingCancel,
  mobileKastleFirst = true,
  compact = false,
}: L1WalletConnectOptionsProps) {
  const { isInstalled } = useKaspaProviderProbe();
  const isMobile = useIsMobileViewport();
  const isMobileUa = isMobileUserAgent();
  const onMobile = isMobile || isMobileUa;
  const [hintProvider, setHintProvider] = useState<ConnectableProvider | null>(null);
  const [kaspireUri, setKaspireUri] = useState<string | null>(null);
  const [iosNotice, setIosNotice] = useState(false);
  /** Local pairing flag so we can close the modal instantly without waiting for parent state. */
  const [kaspirePairingOpen, setKaspirePairingOpen] = useState(false);

  const extensionOrder = mobileKastleFirst && onMobile
    ? (['kastle', 'kasware'] as const)
    : (['kasware', 'kastle'] as const);

  const ordered: ConnectableProvider[] = onMobile
    ? ['kaspire', ...extensionOrder]
    : [...extensionOrder, 'kaspire'];

  const dismissKaspirePairing = () => {
    cancelKaspirePairing();
    setKaspireUri(null);
    setKaspirePairingOpen(false);
    onPairingCancel?.();
  };

  const handleAction = async (provider: ConnectableProvider) => {
    if (provider === 'kaspire') {
      if (isIosUserAgent()) {
        setIosNotice(true);
        setHintProvider(null);
        return;
      }
      setIosNotice(false);
      setHintProvider(null);
      setKaspireUri(null);
      setKaspirePairingOpen(true);
      try {
        await onConnect('kaspire', {
          onPairingUri: (uri) => setKaspireUri(uri),
        });
      } finally {
        setKaspireUri(null);
        setKaspirePairingOpen(false);
      }
      return;
    }

    const installed = providerInstalled(provider, isInstalled);
    if (installed) {
      setHintProvider(null);
      setIosNotice(false);
      await onConnect(provider);
      return;
    }

    if (onMobile) {
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
    ? 'w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-60'
    : 'w-full flex items-center justify-between gap-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-colors disabled:opacity-60';

  const showKaspireModal = kaspirePairingOpen || kaspireUri !== null || connecting === 'kaspire';

  return (
    <div className="space-y-2">
      {onMobile ? (
        <MobileWalletUnavailableNotice networks="L1" allowKaspireHint />
      ) : null}

      {ordered.map((provider) => {
        if (onMobile && provider !== 'kaspire') return null;

        const installed = providerInstalled(provider, isInstalled);
        const label =
          provider === 'kaspire'
            ? `Connect ${KASPA_WALLET_PROVIDERS.kaspire.name}`
            : installed
              ? `Connect ${KASPA_WALLET_PROVIDERS[provider].name}`
              : onMobile
                ? `Get ${KASPA_WALLET_PROVIDERS[provider].name}`
                : `Install ${KASPA_WALLET_PROVIDERS[provider].name}`;

        const side = providerSideLabel(provider, connecting, installed, onMobile);

        return (
          <button
            key={provider}
            type="button"
            onClick={() => void handleAction(provider)}
            disabled={connecting !== null || kaspirePairingOpen}
            className={btnClass}
          >
            <L1WalletConnectLabel
              provider={provider}
              label={label}
              logoSize={compact ? 20 : 22}
            />
            {provider === 'kaspire' ? (
              <L1WalletConnectBadge>
                {connecting === provider || kaspirePairingOpen ? '…' : 'Beta'}
              </L1WalletConnectBadge>
            ) : (
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 shrink-0">
                {side}
              </span>
            )}
          </button>
        );
      })}

      {connecting && connecting !== 'kaspire' ? (
        <p className="px-1 text-xs text-zinc-500">Connecting…</p>
      ) : null}

      {iosNotice ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs leading-snug text-zinc-600 dark:text-zinc-300">
          Kaspire WalletConnect is Android-only for now.{' '}
          <a
            href={KASPIRE_DOWNLOAD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-teal-700 underline-offset-2 hover:underline dark:text-teal-300"
          >
            Learn more
          </a>
          . On iPhone you can still browse; use a desktop browser or Android for L1 connect.
        </div>
      ) : null}

      {hintProvider ? (
        <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/5 px-3 py-2 text-xs leading-snug text-zinc-600 dark:text-zinc-300">
          {mobileWalletConnectHint(hintProvider)}
        </div>
      ) : null}

      {error ? <p className="text-xs text-red-600 dark:text-red-400 px-0.5">{error}</p> : null}

      {showKaspireModal ? (
        <KaspirePairingModal
          uri={kaspireUri}
          mode={onMobile ? 'mobile' : 'desktop'}
          onCancel={dismissKaspirePairing}
        />
      ) : null}
    </div>
  );
}

/** Cancel any open Kaspire pairing when a parent dropdown closes. */
export function abortKaspireConnectIfNeeded(): void {
  cancelKaspirePairing();
}
