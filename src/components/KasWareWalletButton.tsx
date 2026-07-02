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
import {
  useBalanceVisibility,
  formatBalanceForDisplay,
  formatBalanceValueForDisplay,
  maskAddress,
  maskKnsDomain,
} from '@/hooks/useBalanceVisibility';
import { detectKaspaWallets } from '@/lib/kaspa/wallet';
import { sendKaspaTransaction } from '@/lib/kaspa/wallet';
import { kasToSompis } from '@/lib/kaspa/api';
import { formatKaspaAddress } from '@/lib/kaspa/wallet';
import { SendTransactionModal } from './modals/SendTransactionModal';
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
import { Tooltip } from '@/components/ui/Tooltip';
import { gameTooltipRich } from '@/components/games/gameTooltipRich';
import { BRIDGE_URLS, getAddressExplorerUrl, shortenAddress } from '@/lib/walletUi';
import { BridgeInfoModal } from '@/components/modals/BridgeInfoModal';
import { ReceiveAddressModal } from '@/components/modals/ReceiveAddressModal';
import { KREXBuyWizard } from '@/components/rewards/KREXBuyWizard';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useRedeemablePointsBreakdown } from '@/hooks/useRedeemablePointsBreakdown';
import { NFTStatusBox } from '@/components/rewards/NFTStatusBox';
// Bridge is handled by BridgeInfoModal (shared with L2).
import { HelpModal } from '@/components/modals/HelpModal';
import { RewardsModal } from '@/components/modals/RewardsModal';
import { KREX_TIERS } from '@/lib/rewards/types';
import { useRouter } from 'next/navigation';
import { NodeStatusModal } from '@/components/modals/NodeStatusModal';
import { NFTBuyWizard } from '@/components/rewards/NFTBuyWizard';
import { useKnsPrimaryName } from '@/hooks/useKnsPrimaryName';

export function KasWareWalletButton() {
  const router = useRouter();
  const { state, connect, disconnect } = useKaspaWallet();
  const { balance, isLoading: balanceLoading, refresh: refreshBalance } = useKaspaBalance();
  const { isVisible: isBalanceVisible } = useBalanceVisibility();
  const { primaryName: knsPrimaryName } = useKnsPrimaryName(state.address);

  // Rewards/holdings hooks (must be top-level)
  const { l1Balance: krexL1Balance, tier: krexTier, isLoading: isKrexLoading, refetch: refetchKrex } = useKREXBalance();
  const { totalRedeemable: hubPts } = useRedeemablePointsBreakdown();
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [krc20Tokens, setKrc20Tokens] = useState<Array<{ tick: string; amount: string | number; [key: string]: any }>>([]);
  const [krc20TokensLoading, setKrc20TokensLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Modal states
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isUtxoModalOpen, setIsUtxoModalOpen] = useState(false);
  const [isBridgeInfoOpen, setIsBridgeInfoOpen] = useState(false);
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [isKrexBuyWizardOpen, setIsKrexBuyWizardOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isRewardsOpen, setIsRewardsOpen] = useState(false);
  const [isNodeOpen, setIsNodeOpen] = useState(false);
  const [isNftWizardOpen, setIsNftWizardOpen] = useState(false);

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
      // Always copy full Kaspa address with "kaspa:" prefix.
      const full = state.address.toLowerCase().startsWith('kaspa:') ? state.address : `kaspa:${state.address}`;
      await navigator.clipboard.writeText(full);
      setIsDropdownOpen(false);
    } catch (error: any) {
      console.error('Failed to copy address:', error);
      setError(error.message || 'Failed to copy address');
    }
  };

  // If connected, show button with balance and address
  if (state.isConnected && state.address && state.provider === 'kasware') {
    const address = state.address;
    const displayAddress = maskAddress(shortenAddress(formatAddressForDisplay(address), { head: 10, tail: 8 }), isBalanceVisible);
    const displayBalance = formatBalanceValueForDisplay(balance, balanceLoading, isBalanceVisible);
    const explorerUrl = getAddressExplorerUrl({ kind: 'kaspa-l1', address });
    const displayPrimary = maskKnsDomain(knsPrimaryName, isBalanceVisible);

    return (
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm font-medium"
          aria-label="KasWare Wallet"
        >
          <span className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded-lg border border-cyan-300/50 dark:border-cyan-600/40 shadow-sm">
            L1
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
            </svg>
            KasWare
          </span>

          <Avatar address={state.address} size={20} />

          <span className="text-zinc-900 dark:text-zinc-100 hidden sm:inline max-w-[200px] truncate">
            {displayPrimary ? displayPrimary : displayAddress}
          </span>
          <span className="text-zinc-900 dark:text-zinc-100 sm:hidden">KasWare</span>

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
                address={address}
                displayAddress={displayAddress}
                onProfile={() => {
                  router.push(`/u/${encodeURIComponent(address)}`);
                  setIsDropdownOpen(false);
                }}
                onRefresh={async () => {
                  await refreshBalance();
                  await refetchKrex();
                }}
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
                    tooltip: 'Send KAS or KRC-20 tokens',
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
                    tooltip: 'Show your Kaspa address to receive funds',
                    icon: 'receive',
                    onClick: () => setIsReceiveOpen(true),
                    variant: 'secondary',
                  },
                  {
                    id: 'bridge',
                    label: 'Bridge',
                    tooltip: 'Bridge assets between L1 and L2',
                    icon: 'bridge',
                    onClick: () => {
                      setIsBridgeInfoOpen(true);
                      setIsDropdownOpen(false);
                    },
                    variant: 'secondary',
                  },
                  {
                    id: 'buy',
                    label: 'Buy',
                    tooltip: 'Buy KREX token',
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
                    value={
                      isBalanceVisible
                        ? (isKrexLoading ? '…' : krexL1Balance.toLocaleString(undefined, { maximumFractionDigits: 2 }))
                        : '***'
                    }
                    sub={`Tier: ${krexTier}`}
                    onClick={() => {
                      setIsDropdownOpen(false);
                      router.push('/tokens/krex');
                    }}
                  />
                  <WalletMiniCard
                    title="KRC-20"
                    value={`${krc20Tokens.length}`}
                    sub="Tokens detected"
                  />
                </div>
              </div>

              <div className="px-4 pb-3">
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/50 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                      Tiers & Benefits (Total)
                    </div>
                    <Tooltip
                      content={gameTooltipRich(
                        'Tier rewards',
                        'Opens perks for your Total tier: multiplier, fees, NFT bonuses, and points.',
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => setIsRewardsOpen(true)}
                        className="p-1 rounded hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 transition-colors"
                        aria-label="View tier rewards & benefits"
                      >
                        <svg className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    </Tooltip>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 dark:text-zinc-400">Tier</span>
                    <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-full bg-[#02abb8]/10 text-[#02abb8] dark:text-[#66dfe8] font-black uppercase tracking-widest">
                      {krexTier}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 dark:text-zinc-400">Multiplier</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{KREX_TIERS[krexTier].multiplier}x</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 dark:text-zinc-400">Discount</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{KREX_TIERS[krexTier].feeDiscountPercent}%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 dark:text-zinc-400">Hub pts</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{hubPts.toLocaleString()}</span>
                  </div>
                  <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                    <NFTStatusBox
                      layout="compact-cards"
                      premiumCollectionsOnly
                      onOpenBuyWizard={() => {
                        setIsNftWizardOpen(true);
                        setIsDropdownOpen(false);
                      }}
                      onOpenNftPage={() => {
                        router.push('/nft');
                        setIsDropdownOpen(false);
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="px-4 pb-3">
                <Tooltip
                  content={gameTooltipRich(
                    'Node status',
                    'Placeholder for operators: staking, sync, and health (coming soon).',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setIsNodeOpen(true);
                      setIsDropdownOpen(false);
                    }}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/50 p-3 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors"
                    aria-label="Open node status (coming soon)"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                        Node status
                      </div>
                      <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400"> - </div>
                    </div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-500 mt-1">
                      Coming soon for node operators.
                    </div>
                  </button>
                </Tooltip>
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
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setIsHelpOpen(true);
                        setIsDropdownOpen(false);
                      }}
                      className="px-3 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm font-semibold transition-colors"
                    >
                      Help
                    </button>
                    <button
                      type="button"
                      onClick={handleDisconnect}
                      className="px-3 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-semibold transition-colors"
                    >
                      Disconnect
                    </button>
                  </>
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
          body="Choose what you want to bridge from L1 to L2."
          links={[
            { label: 'Bridge KRC20 (KREX)', url: BRIDGE_URLS.katBridge, variant: 'primary' },
            { label: 'Bridge KAS ↔ wKAS (Kasplex)', url: BRIDGE_URLS.kasplexKasBridge, variant: 'secondary' },
            { label: 'Bridge KAS ↔ iKAS (IGRA)', url: BRIDGE_URLS.igraIkasBridge, variant: 'secondary' },
            { label: 'NFT Bridge', url: BRIDGE_URLS.nftBridge, variant: 'secondary' },
          ]}
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
        
        <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} title="Help (L1)" />
        <RewardsModal isOpen={isRewardsOpen} onClose={() => setIsRewardsOpen(false)} currentTier={krexTier} krexBalance={krexL1Balance} title="Rewards (L1)" />
        <NodeStatusModal isOpen={isNodeOpen} onClose={() => setIsNodeOpen(false)} title="Node status (L1)" />
        <NFTBuyWizard isOpen={isNftWizardOpen} onClose={() => setIsNftWizardOpen(false)} />
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

