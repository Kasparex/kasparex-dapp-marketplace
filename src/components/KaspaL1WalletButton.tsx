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
import { detectKaspaWallets, formatKaspaAddress } from '@/lib/kaspa/wallet';
import { getErrorMessage } from '@/lib/utils';
import { useBalanceVisibility, maskAddress, formatBalanceForDisplay } from '@/hooks/useBalanceVisibility';
import { Avatar } from './Avatar';
import { WalletDropdownShell } from '@/components/wallet-dropdown/WalletDropdownShell';
import { WalletAddressRow } from '@/components/wallet-dropdown/WalletAddressRow';
import { WalletBalanceCard } from '@/components/wallet-dropdown/WalletBalanceCard';
import { WalletMiniCard } from '@/components/wallet-dropdown/WalletMiniCard';
import { WalletQuickActionsRow } from '@/components/wallet-dropdown/WalletQuickActionsRow';
import { WalletFooterRow } from '@/components/wallet-dropdown/WalletFooterRow';
import { getAddressExplorerUrl, shortenAddress } from '@/lib/walletUi';
import { BridgeInfoModal } from '@/components/modals/BridgeInfoModal';
import { ReceiveAddressModal } from '@/components/modals/ReceiveAddressModal';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useLoyaltyPoints } from '@/hooks/useLoyaltyPoints';
import { NFTStatusBox } from '@/components/rewards/NFTStatusBox';

const KasWareWalletButton = dynamic(
  () => import('./KasWareWalletButton').then((mod) => ({ default: mod.KasWareWalletButton })),
  { ssr: false }
);

export function KaspaL1WalletButton() {
  const { state, connect, disconnect } = useKaspaWallet();
  const { balance, refresh: refreshBalance } = useKaspaBalance();
  const { isVisible: isBalanceVisible } = useBalanceVisibility();

  // Rewards/holdings hooks (must be top-level)
  const { l1Balance: krexL1Balance, tier: krexTier, isLoading: isKrexLoading } = useKREXBalance();
  const { totalPoints: xpPoints } = useLoyaltyPoints();

  const [open, setOpen] = useState(false);
  const [connecting, setConnecting] = useState<'kasware' | 'kastle' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [isBridgeInfoOpen, setIsBridgeInfoOpen] = useState(false);
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);

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
    const address = state.address;
    const formatAddressForDisplay = (addr: string): string => formatKaspaAddress(addr).display;
    const displayAddress = maskAddress(shortenAddress(formatAddressForDisplay(address), { head: 10, tail: 8 }), isBalanceVisible);
    const displayBalance = formatBalanceForDisplay(balance, 'KAS', false, isBalanceVisible);
    const explorerUrl = getAddressExplorerUrl({ kind: 'kaspa-l1', address });

    return (
      <div className="relative" ref={rootRef}>
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm font-medium"
          aria-label="Kastle Wallet"
        >
          <span className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded-lg border border-cyan-300/50 dark:border-cyan-600/40 shadow-sm">
            L1
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
            </svg>
            Kastle
          </span>
          <Avatar address={address} size={20} />
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
          <div className="absolute right-0 mt-2 z-50">
            <WalletDropdownShell>
              <WalletAddressRow
                address={address}
                displayAddress={displayAddress}
                onCopy={async () => {
                  if (!isBalanceVisible) {
                    setError('Please enable balance visibility to copy address');
                    return;
                  }
                  await navigator.clipboard.writeText(address);
                  setOpen(false);
                }}
                onOpenExplorer={
                  explorerUrl
                    ? () => {
                        window.open(explorerUrl, '_blank', 'noopener,noreferrer');
                        setOpen(false);
                      }
                    : undefined
                }
              />

              <WalletBalanceCard value={displayBalance} symbol="KAS" />

              <div className="px-4 pb-3">
                <div className="grid grid-cols-2 gap-2">
                  <WalletMiniCard
                    title="KREX"
                    value={isKrexLoading ? '…' : krexL1Balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    sub={`Tier: ${krexTier}`}
                  />
                  <WalletMiniCard
                    title="Balance"
                    value={displayBalance}
                    sub="Visible in header"
                    onInfo={() => setIsBridgeInfoOpen(true)}
                  />
                </div>
              </div>

              <div className="px-4 pb-3">
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/50 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                      Benefits
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsBridgeInfoOpen(true)}
                      className="p-1 rounded hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 transition-colors"
                      aria-label="Network info"
                      title="Network info"
                    >
                      <svg className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 dark:text-zinc-400">XP Points</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{xpPoints.toLocaleString()}</span>
                  </div>
                  <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                    <NFTStatusBox layout="compact-cards" premiumCollectionsOnly />
                  </div>
                </div>
              </div>

              <WalletQuickActionsRow
                actions={[
                  {
                    id: 'receive',
                    label: 'Receive',
                    icon: 'receive',
                    onClick: () => setIsReceiveOpen(true),
                    variant: 'secondary',
                  },
                  {
                    id: 'bridge',
                    label: 'Bridge',
                    icon: 'bridge',
                    onClick: () => setIsBridgeInfoOpen(true),
                    variant: 'secondary',
                  },
                  {
                    id: 'refresh',
                    label: 'Refresh',
                    icon: 'buy',
                    onClick: async () => {
                      await refreshBalance();
                      setOpen(false);
                    },
                    variant: 'secondary',
                  },
                  {
                    id: 'buy',
                    label: 'Buy',
                    icon: 'buy',
                    onClick: () => setIsBridgeInfoOpen(true),
                    variant: 'primary',
                  },
                ]}
              />

              <WalletFooterRow
                left={
                  <button
                    type="button"
                    onClick={() => setIsBridgeInfoOpen(true)}
                    className="px-3 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm font-semibold transition-colors"
                  >
                    Help
                  </button>
                }
                right={
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="px-3 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-semibold transition-colors"
                  >
                    Disconnect
                  </button>
                }
              />
            </WalletDropdownShell>
          </div>
        )}

        <BridgeInfoModal
          isOpen={isBridgeInfoOpen}
          onClose={() => setIsBridgeInfoOpen(false)}
          networkName="Kaspa L1"
          nativeSymbol="KAS"
        />
        <ReceiveAddressModal
          isOpen={isReceiveOpen}
          onClose={() => setIsReceiveOpen(false)}
          title="Receive (L1)"
          address={state.address}
          displayAddress={maskAddress(state.address, isBalanceVisible)}
          onCopy={async () => {
            if (!isBalanceVisible) {
              setError('Please enable balance visibility to copy address');
              return;
            }
            await navigator.clipboard.writeText(state.address);
            setIsReceiveOpen(false);
          }}
        />
      </div>
    );
  }

  // Disconnected UI: dropdown KasWare / Kastle
  return (
    <div className="relative" ref={rootRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium flex items-center gap-2 shadow-lg shadow-cyan-500/15"
        disabled={connecting !== null}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Connect L1 Wallet
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

