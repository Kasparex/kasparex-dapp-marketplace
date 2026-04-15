/**
 * EVM Wallet Button
 * 
 * Custom button component for EVM wallets - shows connect button when disconnected,
 * and opens UserMenu dropdown when connected
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useBalance, useDisconnect, useChainId } from 'wagmi';
import { ConnectButton, useChainModal } from '@rainbow-me/rainbowkit';
import { formatUnits } from 'viem';
import { Avatar } from './Avatar';
import { useBalanceVisibility, formatBalanceForDisplay, maskAddress } from '@/hooks/useBalanceVisibility';
import { getChainById } from '@/lib/wagmi';
import { getContractAddress } from '@/lib/contracts/addresses';
import { useGRIDToken } from '@/hooks/useGRIDToken';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useLoyaltyPoints } from '@/hooks/useLoyaltyPoints';
import { NFTStatusBox } from '@/components/rewards/NFTStatusBox';
import { BridgeInfoModal } from '@/components/modals/BridgeInfoModal';
import { ReceiveAddressModal } from '@/components/modals/ReceiveAddressModal';
import { WalletDropdownShell } from '@/components/wallet-dropdown/WalletDropdownShell';
import { WalletAddressRow } from '@/components/wallet-dropdown/WalletAddressRow';
import { WalletBalanceCard } from '@/components/wallet-dropdown/WalletBalanceCard';
import { WalletMiniCard } from '@/components/wallet-dropdown/WalletMiniCard';
import { WalletQuickActionsRow } from '@/components/wallet-dropdown/WalletQuickActionsRow';
import { WalletFooterRow } from '@/components/wallet-dropdown/WalletFooterRow';
import { getAddressExplorerUrl, getUiNativeSymbol, shortenAddress } from '@/lib/walletUi';

export function EVMWalletButton() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { disconnect } = useDisconnect();
  const { openChainModal } = useChainModal();
  const router = useRouter();
  const { isVisible: isBalanceVisible } = useBalanceVisibility();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isBridgeInfoOpen, setIsBridgeInfoOpen] = useState(false);
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);

  // Get current network info
  const chain = chainId ? getChainById(chainId) : null;
  const isTestnet = Boolean(chain?.testnet);

  // Rewards/holdings hooks (must be top-level)
  const { tier: krexTier, tierForChain, l2Balance: krexL2Balance, isLoading: isKrexLoading } = useKREXBalance();
  const { totalPoints: xpPoints } = useLoyaltyPoints();

  const gridTokenAddress = (() => {
    if (!chainId) return null;
    if (isTestnet) {
      const tgrid = getContractAddress(chainId, 'tGRID');
      return tgrid || null;
    }
    return getContractAddress(chainId, 'GRIDToken') || null;
  })();
  const { formattedBalance: gridFormatted, isLoading: isGridLoading } = useGRIDToken(gridTokenAddress);

  // Determine dynamic network label and styling
  let networkLabel = 'EVM';
  let networkBadgeColorClass =
    isTestnet
      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border border-yellow-300/50 dark:border-yellow-600/40'
      : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border border-emerald-300/50 dark:border-emerald-600/40';
  
  if (chain) {
    // Show full network name (e.g. "Igra Testnet", "Kasplex Mainnet")
    networkLabel = chain.name;
  }

  const { data: balance } = useBalance({
    address: address,
    query: {
      enabled: isConnected && !!address,
    },
  });

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

  // If connected, show button with UserMenu dropdown
  if (isConnected && address) {
    const balanceValue = balance 
      ? parseFloat(formatUnits(balance.value, balance.decimals))
      : 0;
    const chainNative = chain?.nativeCurrency?.symbol || balance?.symbol || 'KAS';
    const uiNative = getUiNativeSymbol(chainId, chainNative);
    const displayBalance = formatBalanceForDisplay(balanceValue, uiNative, false, isBalanceVisible);

    const displayAddress = maskAddress(shortenAddress(address, { head: 4, tail: 4 }), isBalanceVisible);
    const displayAddressLong = maskAddress(shortenAddress(address, { head: 6, tail: 4 }), isBalanceVisible);

    const explorerUrl = getAddressExplorerUrl({
      kind: 'evm',
      address,
      chainExplorerBaseUrl: chain?.blockExplorers?.default?.url,
    });

    const handleViewProfile = () => {
      router.push(`/user/${address}`);
      setIsDropdownOpen(false);
    };

    // Edit functionality removed - profiles are now read-only

    const handleCopyAddress = async () => {
      if (address) {
        if (!isBalanceVisible) {
          alert('Please enable balance visibility to copy address');
          return;
        }
        await navigator.clipboard.writeText(address);
      }
    };

    const handleDisconnect = () => {
      disconnect();
      setIsDropdownOpen(false);
    };

    return (
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm font-medium relative"
          aria-label="EVM Wallet"
        >
          {/* Network badge */}
          <span
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg shadow-sm ${networkBadgeColorClass}`}
            title={networkLabel}
          >
            L2
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
            </svg>
            {networkLabel}
          </span>
          
          {/* Avatar */}
          <Avatar address={address} size={20} />
          
          {/* Address on right */}
          <span className="text-zinc-900 dark:text-zinc-100 hidden sm:inline">{displayAddress}</span>
          <span className="text-zinc-900 dark:text-zinc-100 sm:hidden">L2</span>
          
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
          <div className="absolute right-0 top-full mt-2 z-[9999]">
            <WalletDropdownShell>
              <WalletAddressRow
                address={address}
                displayAddress={displayAddressLong}
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

              <WalletBalanceCard value={displayBalance} symbol={uiNative} />

              <div className="px-4 pb-3">
                <div className="grid grid-cols-2 gap-2">
                  <WalletMiniCard
                    title={chainId === 38836 ? 'tKREX' : 'KREX'}
                    value={isKrexLoading ? '…' : krexL2Balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    sub={`Tier: ${tierForChain}`}
                  />
                  <WalletMiniCard
                    title={isTestnet ? 'tGRID' : 'GRID'}
                    value={gridTokenAddress ? (isGridLoading ? '…' : gridFormatted) : '—'}
                    sub={gridTokenAddress ? undefined : 'Not deployed'}
                    onInfo={!gridTokenAddress ? () => setIsBridgeInfoOpen(true) : undefined}
                  />
                </div>
              </div>

              <div className="px-4 pb-3">
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/50 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                      Tier & benefits
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
                    <span className="text-zinc-500 dark:text-zinc-400">Tier</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{krexTier}</span>
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
                  { id: 'send', label: 'Send', icon: 'send', onClick: () => setIsBridgeInfoOpen(true), variant: 'secondary' },
                  { id: 'receive', label: 'Receive', icon: 'receive', onClick: () => setIsReceiveOpen(true), variant: 'secondary' },
                  { id: 'bridge', label: 'Bridge', icon: 'bridge', onClick: () => setIsBridgeInfoOpen(true), variant: 'secondary' },
                  { id: 'buy', label: 'Buy', icon: 'buy', onClick: () => router.push('/store'), variant: 'primary' },
                ]}
              />

              <WalletFooterRow
                left={
                  <button
                    type="button"
                    onClick={() => {
                      handleViewProfile();
                    }}
                    className="px-3 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm font-semibold transition-colors"
                  >
                    Profile
                  </button>
                }
                right={
                  <>
                    <button
                      type="button"
                      onClick={() => setIsBridgeInfoOpen(true)}
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
          networkName={networkLabel}
          nativeSymbol={uiNative}
          primaryAction={{
            label: 'Open store',
            onClick: () => {
              setIsBridgeInfoOpen(false);
              setIsDropdownOpen(false);
              router.push('/store');
            },
          }}
          secondaryAction={{
            label: 'Switch network',
            onClick: () => {
              setIsBridgeInfoOpen(false);
              openChainModal?.();
            },
          }}
        />
        <ReceiveAddressModal
          isOpen={isReceiveOpen}
          onClose={() => setIsReceiveOpen(false)}
          title="Receive (L2)"
          address={address}
          displayAddress={displayAddressLong}
          onCopy={async () => {
            await handleCopyAddress();
            setIsReceiveOpen(false);
          }}
        />
      </div>
    );
  }

  // If not connected, show Connect Wallet button
  return (
    <ConnectButton.Custom>
      {({ openConnectModal, mounted }) => {
        const ready = mounted;

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            <button
              onClick={openConnectModal}
              type="button"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white transition-all text-sm font-medium flex items-center gap-2 shadow-lg shadow-indigo-500/10"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Connect L2 Wallet
            </button>
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
