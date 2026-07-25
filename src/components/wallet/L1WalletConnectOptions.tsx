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

function ExtensionWalletRow({
  provider,
  connecting,
  kaspirePairingOpen,
  isInstalled,
  onMobile,
  compact,
  btnClass,
  onAction,
}: {
  provider: 'kasware' | 'kastle';
  connecting: ConnectableProvider | null;
  kaspirePairingOpen: boolean;
  isInstalled: (id: string) => boolean;
  onMobile: boolean;
  compact: boolean;
  btnClass: string;
  onAction: (provider: ConnectableProvider) => void;
}) {
  const installed = providerInstalled(provider, isInstalled);
  const label = installed
    ? `Connect ${KASPA_WALLET_PROVIDERS[provider].name}`
    : onMobile
      ? `Get ${KASPA_WALLET_PROVIDERS[provider].name}`
      : `Install ${KASPA_WALLET_PROVIDERS[provider].name}`;
  const side =
    connecting === provider
      ? 'Connecting…'
      : installed
        ? 'L1'
        : onMobile
          ? 'App'
          : 'Install';

  return (
    <button
      type="button"
      onClick={() => onAction(provider)}
      disabled={connecting !== null || kaspirePairingOpen}
      className={btnClass}
    >
      <L1WalletConnectLabel provider={provider} label={label} logoSize={compact ? 20 : 22} />
      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 shrink-0">{side}</span>
    </button>
  );
}

function KaspireWalletRow({
  connecting,
  kaspirePairingOpen,
  compact,
  btnClass,
  onAction,
}: {
  connecting: ConnectableProvider | null;
  kaspirePairingOpen: boolean;
  compact: boolean;
  btnClass: string;
  onAction: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onAction}
      disabled={connecting !== null || kaspirePairingOpen}
      className={btnClass}
    >
      <L1WalletConnectLabel
        provider="kaspire"
        label={`Connect ${KASPA_WALLET_PROVIDERS.kaspire.name}`}
        logoSize={compact ? 20 : 22}
      />
      <L1WalletConnectBadge>
        {connecting === 'kaspire' || kaspirePairingOpen ? '…' : 'Beta'}
      </L1WalletConnectBadge>
    </button>
  );
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
  const [kaspirePairingOpen, setKaspirePairingOpen] = useState(false);

  const extensionOrder = mobileKastleFirst && onMobile
    ? (['kastle', 'kasware'] as const)
    : (['kasware', 'kastle'] as const);

  const dismissKaspirePairing = () => {
    cancelKaspirePairing();
    setKaspireUri(null);
    setKaspirePairingOpen(false);
    onPairingCancel?.();
  };

  const handleExtension = async (provider: ConnectableProvider) => {
    if (provider === 'kaspire') return;
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

  const handleKaspire = async () => {
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

      {/* Desktop / tablet: browser extensions first */}
      {!onMobile
        ? extensionOrder.map((provider) => (
            <ExtensionWalletRow
              key={provider}
              provider={provider}
              connecting={connecting}
              kaspirePairingOpen={kaspirePairingOpen}
              isInstalled={isInstalled}
              onMobile={onMobile}
              compact={compact}
              btnClass={btnClass}
              onAction={(p) => void handleExtension(p)}
            />
          ))
        : null}

      {/* Desktop: section for Android / APK WalletConnect wallets */}
      {!onMobile ? (
        <div className="pt-1">
          <div className="border-t border-dashed border-zinc-300 dark:border-zinc-600" role="separator" />
          <p className="px-1 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Mobile wallets
          </p>
          <p className="px-1 pb-1.5 text-[10px] leading-snug text-zinc-500 dark:text-zinc-500">
            Android APK via WalletConnect QR. Install Kaspire on your phone, then scan.
          </p>
          <KaspireWalletRow
            connecting={connecting}
            kaspirePairingOpen={kaspirePairingOpen}
            compact={compact}
            btnClass={btnClass}
            onAction={() => void handleKaspire()}
          />
        </div>
      ) : (
        <>
          <p className="px-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Mobile wallets
          </p>
          <p className="px-1 pb-1 text-[10px] leading-snug text-zinc-500 dark:text-zinc-500">
            Requires the Kaspire Android APK installed on this device. Play Store listing is not required.
          </p>
          <KaspireWalletRow
            connecting={connecting}
            kaspirePairingOpen={kaspirePairingOpen}
            compact={compact}
            btnClass={btnClass}
            onAction={() => void handleKaspire()}
          />
          <a
            href={KASPIRE_DOWNLOAD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="block px-1 text-[11px] font-medium text-teal-700 underline-offset-2 hover:underline dark:text-teal-300"
          >
            Download Kaspire APK
          </a>
        </>
      )}

      {connecting && connecting !== 'kaspire' ? (
        <p className="px-1 text-xs text-zinc-500">Connecting…</p>
      ) : null}

      {iosNotice ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs leading-snug text-zinc-600 dark:text-zinc-300">
          Kaspire is Android-only for now (APK). On iPhone, use a desktop browser and scan the QR from your Android device, or browse without connecting.
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
