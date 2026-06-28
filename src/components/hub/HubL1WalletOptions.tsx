'use client';

import { useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { detectKaspaWallets, KASPA_WALLET_PROVIDERS } from '@/lib/kaspa/wallet';
import { getErrorMessage } from '@/lib/utils';
import { L1WalletConnectLabel } from '@/components/wallet/L1WalletLogo';

export function HubL1WalletOptions({ onConnected }: { onConnected?: () => void }) {
  const { connect } = useKaspaWallet();
  const [connecting, setConnecting] = useState<'kasware' | 'kastle' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const detected = detectKaspaWallets();
  const isKasWareInstalled = detected.some((w) => w.id === 'kasware' && w.isInstalled);
  const isKastleInstalled = typeof window !== 'undefined' && !!(window as Window & { kastle?: unknown }).kastle;

  const handleWalletAction = async (provider: 'kasware' | 'kastle') => {
    const installed = provider === 'kasware' ? isKasWareInstalled : isKastleInstalled;
    if (!installed) {
      const url =
        KASPA_WALLET_PROVIDERS[provider].downloadUrl ??
        KASPA_WALLET_PROVIDERS[provider].documentationUrl;
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
      else setError(`${provider === 'kasware' ? 'KasWare' : 'Kastle'} is not installed`);
      return;
    }

    setConnecting(provider);
    setError(null);
    try {
      await connect(provider, {
        enableSIWK: true,
        siwkParams: {
          domain: typeof window !== 'undefined' ? window.location.hostname : 'kasparex.com',
          statement: 'Welcome to Kasparex!',
          appName: 'Kasparex',
        },
      });
      onConnected?.();
    } catch (err) {
      setError(getErrorMessage(err, `Failed to connect to ${provider}`));
    } finally {
      setConnecting(null);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => void handleWalletAction('kasware')}
        disabled={connecting !== null}
        className="w-full flex items-center justify-between gap-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <L1WalletConnectLabel
          provider="kasware"
          label={isKasWareInstalled ? 'KasWare' : 'Install KasWare'}
        />
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {connecting === 'kasware' ? 'Connecting…' : 'L1'}
        </span>
      </button>
      <button
        type="button"
        onClick={() => void handleWalletAction('kastle')}
        disabled={connecting !== null}
        className="w-full flex items-center justify-between gap-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <L1WalletConnectLabel
          provider="kastle"
          label={isKastleInstalled ? 'Kastle' : 'Install Kastle'}
        />
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {connecting === 'kastle' ? 'Connecting…' : 'L1'}
        </span>
      </button>
      {error ? <p className="text-xs text-red-600 dark:text-red-400">{error}</p> : null}
    </div>
  );
}
