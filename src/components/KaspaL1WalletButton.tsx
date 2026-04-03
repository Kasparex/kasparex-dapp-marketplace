/**
 * Unified Kaspa L1 wallet button:
 * - If disconnected: dropdown to connect KasWare or Kastle
 * - If connected:
 *   - KasWare: reuse existing full-feature button
 *   - Kastle: show balance/address + basic actions
 */
 
'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useKaspaBalance } from '@/hooks/useKaspaBalance';
import { detectKaspaWallets, KASPA_WALLET_PROVIDERS } from '@/lib/kaspa/wallet';
import { getErrorMessage } from '@/lib/utils';
import { useBalanceVisibility, maskAddress, formatBalanceForDisplay } from '@/hooks/useBalanceVisibility';

const KasWareWalletButton = dynamic(
  () => import('./KasWareWalletButton').then((mod) => ({ default: mod.KasWareWalletButton })),
  { ssr: false }
);

export function KaspaL1WalletButton() {
  const { state, connect, disconnect } = useKaspaWallet();
  const { balance, refresh: refreshBalance } = useKaspaBalance();
  const { isVisible: isBalanceVisible } = useBalanceVisibility();

  const [open, setOpen] = useState(false);
  const [connecting, setConnecting] = useState<'kasware' | 'kastle' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const detected = detectKaspaWallets();
  const isKasWareInstalled = detected.some((w) => w.id === 'kasware' && w.isInstalled);
  const isKastleInstalled = typeof window !== 'undefined' && !!(window as any).kastle;

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // If KasWare is connected, reuse the existing full-feature UI
  if (state.isConnected && state.provider === 'kasware') {
    return <KasWareWalletButton />;
  }

  const handleConnect = async (provider: 'kasware' | 'kastle') => {
    setConnecting(provider);
    setError(null);
    try {
      await connect(provider, {
        enableSIWK: true,
        siwkParams: {
          domain: typeof window !== 'undefined' ? window.location.hostname : 'kasparex.com',
          statement: 'Welcome to Kasparex dApps!',
          appName: 'Kasparex dApps',
        },
      });
      setOpen(false);
    } catch (err) {
      setError(getErrorMessage(err, `Failed to connect to ${provider}`));
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      setOpen(false);
    } catch {
      // ignore
    }
  };

  // Kastle connected UI (basic)
  if (state.isConnected && state.address && state.provider === 'kastle') {
    const displayAddress = maskAddress(state.address, isBalanceVisible);
    const displayBalance = formatBalanceForDisplay(balance, 'KAS', false, isBalanceVisible);

    return (
      <div className="relative" ref={rootRef}>
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm font-medium"
          aria-label="Kastle Wallet"
        >
          <span className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded-[6px] border border-cyan-300/50 dark:border-cyan-600/40 shadow-sm">
            L1 Kaspa
          </span>
          <span className="text-zinc-900 dark:text-zinc-100 hidden sm:inline">{displayAddress}</span>
          <span className="text-zinc-900 dark:text-zinc-100 sm:hidden">Kastle</span>
          <svg
            className={`w-4 h-4 text-zinc-600 dark:text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-800 z-50">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Kastle Wallet</span>
                <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded">
                  Connected
                </span>
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 font-mono break-all mb-3">
                {maskAddress(state.address, isBalanceVisible)}
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3 mb-3">
                <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">KAS Balance</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{displayBalance}</span>
                  <span className="text-xs text-zinc-600 dark:text-zinc-400">KAS</span>
                </div>
              </div>
            </div>
            <div className="p-2">
              <button
                onClick={async () => {
                  await refreshBalance();
                  setOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                Refresh balance
              </button>
              <div className="border-t border-zinc-200 dark:border-zinc-800 my-2" />
              <button
                onClick={handleDisconnect}
                className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                Disconnect
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Disconnected UI: dropdown KasWare / Kastle
  return (
    <div className="relative" ref={rootRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center gap-2"
        disabled={connecting !== null}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Connect wallet
        <svg
          className={`w-4 h-4 opacity-90 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-800 z-50">
          <div className="p-2">
            <button
              onClick={() => handleConnect('kasware')}
              disabled={!isKasWareInstalled || connecting !== null}
              className="w-full px-3 py-2 text-left text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50"
            >
              {isKasWareInstalled ? 'Connect KasWare' : 'Install KasWare'}
            </button>
            <button
              onClick={() => handleConnect('kastle')}
              disabled={!isKastleInstalled || connecting !== null}
              className="w-full px-3 py-2 text-left text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50"
            >
              {isKastleInstalled ? 'Connect Kastle' : 'Install Kastle'}
            </button>

            {connecting && (
              <div className="px-3 py-2 text-xs text-zinc-500">
                Connecting…
              </div>
            )}

            {error && (
              <div className="px-3 py-2 text-xs text-red-600 dark:text-red-400">
                {error}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

