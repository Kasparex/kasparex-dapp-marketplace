/**
 * KasWare Wallet Connect Button
 * 
 * Built using the L1 Kaspa wallet connection SDK
 * Provides full wallet integration with balance fetching and transaction support
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { Avatar } from './Avatar';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useKaspaBalance } from '@/hooks/useKaspaBalance';
import { useBalanceVisibility, formatBalanceForDisplay, maskAddress } from '@/hooks/useBalanceVisibility';
import { detectKaspaWallets } from '@/lib/kaspa/wallet';
import { sendKaspaTransaction } from '@/lib/kaspa/wallet';
import { kasToSompis } from '@/lib/kaspa/api';
import { formatKaspaAddress } from '@/lib/kaspa/wallet';
import { SendTransactionModal } from './modals/SendTransactionModal';
import { KRC20OrderModal } from './modals/KRC20OrderModal';
import { UtxoViewerModal } from './modals/UtxoViewerModal';
import { getErrorMessage } from '@/lib/utils';
import { getKRC20Balance, getUtxoEntries } from '@/lib/kaspa/kasware';
import type { KaspaTransactionRequest } from '@/lib/kaspa/types';
import { WalletDropdownShell } from '@/components/wallet-dropdown/WalletDropdownShell';
import { WalletAddressRow } from '@/components/wallet-dropdown/WalletAddressRow';
import { WalletBalanceCard } from '@/components/wallet-dropdown/WalletBalanceCard';
import { WalletMiniCard } from '@/components/wallet-dropdown/WalletMiniCard';
import { WalletQuickActionsRow } from '@/components/wallet-dropdown/WalletQuickActionsRow';
import { WalletFooterRow } from '@/components/wallet-dropdown/WalletFooterRow';
import { BRIDGE_URLS, getAddressExplorerUrl, shortenAddress } from '@/lib/walletUi';
import { BridgeInfoModal } from '@/components/modals/BridgeInfoModal';
import { ReceiveAddressModal } from '@/components/modals/ReceiveAddressModal';
import { BridgeOptionsModal } from '@/components/modals/BridgeOptionsModal';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useLoyaltyPoints } from '@/hooks/useLoyaltyPoints';
import { NFTStatusBox } from '@/components/rewards/NFTStatusBox';
import { KREXBuyWizard } from '@/components/rewards/KREXBuyWizard';

export function KasWareWalletButton() {
  const { state, connect, disconnect } = useKaspaWallet();
  const { balance, isLoading: balanceLoading, refresh: refreshBalance } = useKaspaBalance();
  const { isVisible: isBalanceVisible } = useBalanceVisibility();

  // Rewards/holdings hooks (must be top-level)
  const { l1Balance: krexL1Balance, tier: krexTier, isLoading: isKrexLoading } = useKREXBalance();
  const { totalPoints: xpPoints } = useLoyaltyPoints();
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [krc20Tokens, setKrc20Tokens] = useState<Array<{ tick: string; amount: string | number; [key: string]: any }>>([]);
  const [krc20TokensLoading, setKrc20TokensLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Modal states
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isUtxoModalOpen, setIsUtxoModalOpen] = useState(false);
  const [isKRC20ModalOpen, setIsKRC20ModalOpen] = useState(false);
  const [krc20ModalMode, setKrc20ModalMode] = useState<'create' | 'buy' | 'cancel'>('create');
  const [isBridgeInfoOpen, setIsBridgeInfoOpen] = useState(false);
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [isBridgeOptionsOpen, setIsBridgeOptionsOpen] = useState(false);
  const [isKrexBuyWizardOpen, setIsKrexBuyWizardOpen] = useState(false);

  // Check if KasWare is installed
  const isKasWareInstalled = detectKaspaWallets().some(w => w.id === 'kasware' && w.isInstalled);

  // Format address for display
  const formatAddressForDisplay = (addr: string): string => {
    const formatted = formatKaspaAddress(addr);
    return formatted.display;
  };


  // Fetch KRC-20 tokens when connected
  useEffect(() => {
    if (!state.isConnected || state.provider !== 'kasware') {
      setKrc20Tokens([]);
      return;
    }

    const fetchKRC20Tokens = async () => {
      setKrc20TokensLoading(true);
      try {
        const tokens = await getKRC20Balance();
        setKrc20Tokens(tokens || []);
      } catch (err) {
        console.error('Failed to fetch KRC-20 tokens:', err);
        setKrc20Tokens([]);
      } finally {
        setKrc20TokensLoading(false);
      }
    };

    fetchKRC20Tokens();
    const interval = setInterval(fetchKRC20Tokens, 60000);
    return () => clearInterval(interval);
  }, [state.isConnected, state.provider]);


  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Connect to KasWare wallet
  const handleConnect = async () => {
    if (!isKasWareInstalled) {
      setError('KasWare wallet is not installed');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      await connect('kasware', {
        enableSIWK: true,
        siwkParams: {
          domain: typeof window !== 'undefined' ? window.location.hostname : 'kasparex.com',
          statement: 'Welcome to Kasparex dApps!',
          appName: 'Kasparex dApps',
        },
      });
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Failed to connect to KasWare wallet');
      setError(errorMessage);
      console.error('KasWare connection error:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect
  const handleDisconnect = async () => {
    try {
      await disconnect();
      setIsDropdownOpen(false);
    } catch (err) {
      console.error('Error disconnecting:', err);
    }
  };

  // Copy address to clipboard
  const handleCopyAddress = async () => {
    if (!state.address) return;
    
    try {
      if (!isBalanceVisible) {
        throw new Error('Please enable balance visibility to copy address');
      }
      await navigator.clipboard.writeText(state.address);
      setIsDropdownOpen(false);
    } catch (error: any) {
      console.error('Failed to copy address:', error);
      setError(error.message || 'Failed to copy address');
    }
  };

  // If connected, show button with balance and address
  if (state.isConnected && state.address && state.provider === 'kasware') {
    const displayAddress = maskAddress(shortenAddress(formatAddressForDisplay(state.address), { head: 10, tail: 8 }), isBalanceVisible);
    const displayBalance = formatBalanceForDisplay(balance, 'KAS', false, isBalanceVisible);
    const explorerUrl = getAddressExplorerUrl({ kind: 'kaspa-l1', address: state.address });

    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm font-medium"
          aria-label="KasWare Wallet"
        >
          {/* Network Badge on left - Bigger with signal icon */}
          <span className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded-lg border border-cyan-300/50 dark:border-cyan-600/40 shadow-sm">
            L1
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
            </svg>
            KasWare
          </span>
          
          {/* Avatar */}
          <Avatar address={state.address} size={20} />
          
          {/* Address on right */}
          <span className="text-zinc-900 dark:text-zinc-100 hidden sm:inline">{displayAddress}</span>
          <span className="text-zinc-900 dark:text-zinc-100 sm:hidden">KasWare</span>
          
          {/* Chevron */}
          <svg
            className={`w-4 h-4 text-zinc-600 dark:text-zinc-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 z-50">
            <WalletDropdownShell>
              <WalletAddressRow
                address={state.address}
                displayAddress={displayAddress}
                onCopy={async () => {
                  await handleCopyAddress();
                  setIsDropdownOpen(false);
                }}
                onOpenExplorer={
                  explorerUrl
                    ? () => {
                        window.open(explorerUrl, '_blank', 'noopener,noreferrer');
                        setIsDropdownOpen(false);
                      }
                    : undefined
                }
              />

              <WalletQuickActionsRow
                actions={[
                  {
                    id: 'send',
                    label: 'Send',
                    icon: 'send',
                    onClick: () => {
                      setIsSendModalOpen(true);
                      setIsDropdownOpen(false);
                    },
                    variant: 'primary',
                  },
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
                    onClick: () => {
                      setIsBridgeOptionsOpen(true);
                      setIsDropdownOpen(false);
                    },
                    variant: 'secondary',
                  },
                  {
                    id: 'buy',
                    label: 'Buy',
                    icon: 'buy',
                    onClick: () => {
                      setIsDropdownOpen(false);
                      setIsKrexBuyWizardOpen(true);
                    },
                    variant: 'secondary',
                  },
                ]}
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
                    title="KRC-20"
                    value={`${krc20Tokens.length}`}
                    sub="Tokens detected"
                    onInfo={() => {
                      setKrc20ModalMode('create');
                      setIsKRC20ModalOpen(true);
                      setIsDropdownOpen(false);
                    }}
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

              <WalletFooterRow
                left={
                  <button
                    type="button"
                    onClick={() => {
                      setIsUtxoModalOpen(true);
                      setIsDropdownOpen(false);
                    }}
                    className="px-3 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm font-semibold transition-colors"
                  >
                    UTXOs
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
          primaryAction={{
            label: 'Open bridge / buy',
            onClick: () => {
              setIsBridgeInfoOpen(false);
              setIsDropdownOpen(false);
              setKrc20ModalMode('buy');
              setIsKRC20ModalOpen(true);
            },
          }}
        />
        <ReceiveAddressModal
          isOpen={isReceiveOpen}
          onClose={() => setIsReceiveOpen(false)}
          title="Receive (L1)"
          address={state.address}
          displayAddress={maskAddress(state.address, isBalanceVisible)}
          onCopy={async () => {
            await handleCopyAddress();
            setIsReceiveOpen(false);
          }}
        />

        <BridgeOptionsModal isOpen={isBridgeOptionsOpen} onClose={() => setIsBridgeOptionsOpen(false)} />
        <KREXBuyWizard isOpen={isKrexBuyWizardOpen} onClose={() => setIsKrexBuyWizardOpen(false)} />

        {/* Modals */}
        <SendTransactionModal
          isOpen={isSendModalOpen}
          onClose={() => {
            setIsSendModalOpen(false);
            refreshBalance();
          }}
          currentBalance={balance}
          address={state.address}
        />
        
        <UtxoViewerModal
          isOpen={isUtxoModalOpen}
          onClose={() => setIsUtxoModalOpen(false)}
        />
        
        <KRC20OrderModal
          isOpen={isKRC20ModalOpen}
          onClose={() => setIsKRC20ModalOpen(false)}
          mode={krc20ModalMode}
          krc20Tokens={krc20Tokens}
          currentBalance={balance}
        />
      </div>
    );
  }

  // Not connected - show connect button
  return (
    <button
      onClick={handleConnect}
      disabled={!isKasWareInstalled || isConnecting}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center gap-2"
    >
      {isConnecting ? (
        <>
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Connecting...
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          {isKasWareInstalled ? 'Connect KasWare' : 'Install KasWare'}
        </>
      )}
    </button>
  );
}

