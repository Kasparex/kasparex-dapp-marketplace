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
import { useBalanceVisibility, formatBalanceForDisplay, formatBalanceValueForDisplay, maskAddress } from '@/hooks/useBalanceVisibility';
import { getChainById } from '@/lib/wagmi';
import { getContractAddress } from '@/lib/contracts/addresses';
import { useGRIDToken } from '@/hooks/useGRIDToken';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useLoyaltyPoints } from '@/hooks/useLoyaltyPoints';
import { BridgeInfoModal } from '@/components/modals/BridgeInfoModal';
import { ReceiveAddressModal } from '@/components/modals/ReceiveAddressModal';
import { SendL2TransactionModal } from '@/components/modals/SendL2TransactionModal';
import { KREXBuyWizard } from '@/components/rewards/KREXBuyWizard';
import { HelpModal } from '@/components/modals/HelpModal';
import { RewardsModal } from '@/components/modals/RewardsModal';
import { KREX_TIERS } from '@/lib/rewards/types';
import { NodeStatusModal } from '@/components/modals/NodeStatusModal';
import { WalletDropdownShell } from '@/components/wallet-dropdown/WalletDropdownShell';
import { WalletAddressRow } from '@/components/wallet-dropdown/WalletAddressRow';
import { WalletBalanceCard } from '@/components/wallet-dropdown/WalletBalanceCard';
import { WalletMiniCard } from '@/components/wallet-dropdown/WalletMiniCard';
import { WalletQuickActionsRow } from '@/components/wallet-dropdown/WalletQuickActionsRow';
import { WalletFooterRow } from '@/components/wallet-dropdown/WalletFooterRow';
import { BRIDGE_URLS, getAddressExplorerUrl, getNetworkBridgeUrl, getUiNativeSymbol, shortenAddress } from '@/lib/walletUi';
import { Tooltip } from '@/components/ui/Tooltip';
import { gameTooltipRich } from '@/components/games/gameTooltipRich';

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
  const [isSendOpen, setIsSendOpen] = useState(false);
  const [isKrexBuyWizardOpen, setIsKrexBuyWizardOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isRewardsOpen, setIsRewardsOpen] = useState(false);
  const [isNodeOpen, setIsNodeOpen] = useState(false);

  // Get current network info
  const chain = chainId ? getChainById(chainId) : null;
  const isTestnet = Boolean(chain?.testnet);

  // Rewards/holdings hooks (must be top-level)
  const { tier: krexTier, tierForChain, l2Balance: krexL2Balance, isLoading: isKrexLoading, refetch: refetchKrex } = useKREXBalance();
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
    const displayBalanceValue = formatBalanceValueForDisplay(balanceValue, false, isBalanceVisible, { decimals: 4 });

    const displayAddress = maskAddress(shortenAddress(address, { head: 4, tail: 4 }), isBalanceVisible);
    const displayAddressLong = maskAddress(shortenAddress(address, { head: 6, tail: 4 }), isBalanceVisible);

    const explorerUrl = getAddressExplorerUrl({
      kind: 'evm',
      address,
      chainExplorerBaseUrl: chain?.blockExplorers?.default?.url,
    });

    const handleViewProfile = () => {
      // Unified profile route (will resolve `.kas` or address; EVM-only links may show a hint).
      router.push(`/u/${encodeURIComponent(address)}`);
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
          {/* Network badge (opens chain switcher) */}
          <Tooltip content={gameTooltipRich('L2 network', 'Opens the chain switcher so you can pick the correct Layer-2 network.')}>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                openChainModal?.();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  openChainModal?.();
                }
              }}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg shadow-sm hover:opacity-90 transition-opacity cursor-pointer ${networkBadgeColorClass}`}
              aria-label="Switch L2 network"
            >
              L2
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
              </svg>
              {networkLabel}
            </span>
          </Tooltip>

          <Avatar address={address} size={20} />

          <span className="text-zinc-900 dark:text-zinc-100 hidden sm:inline">{displayAddress}</span>
          <span className="text-zinc-900 dark:text-zinc-100 sm:hidden">L2</span>

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
                onProfile={() => {
                  handleViewProfile();
                }}
                onRefresh={async () => {
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
                    tooltip: 'Send KAS or tokens',
                    icon: 'send',
                    onClick: () => {
                      setIsSendOpen(true);
                      setIsDropdownOpen(false);
                    },
                    variant: 'primary',
                  },
                  {
                    id: 'receive',
                    label: 'Receive',
                    tooltip: 'Show your address to receive funds',
                    icon: 'receive',
                    onClick: () => setIsReceiveOpen(true),
                    variant: 'secondary',
                  },
                  {
                    id: 'bridge_native',
                    label: 'Bridge',
                    tooltip: 'Bridge KAS/KREX and NFTs',
                    icon: 'bridge',
                    onClick: () => setIsBridgeInfoOpen(true),
                    variant: 'secondary',
                  },
                  {
                    id: 'buy_krex',
                    label: 'Buy KREX',
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

              <WalletBalanceCard
                value={displayBalanceValue}
                symbol={uiNative}
                onCopyAddress={async () => {
                  // Copy native token contract address (wKAS / iKAS) where applicable.
                  const tokenAddress =
                    chainId === 202555 || chainId === 167012
                      ? '0x2c2Ae87Ba178F48637acAe54B87c3924F544a83e'
                      : chainId === 38836 || chainId === 38833
                        ? '0x17Ec7E1768c813E2a3a9b0f94A35605CA520C242'
                        : null;
                  const copy = tokenAddress || address;
                  if (!isBalanceVisible) {
                    alert('Please enable balance visibility to copy address');
                    return;
                  }
                  await navigator.clipboard.writeText(copy);
                  setIsDropdownOpen(false);
                }}
                onOpenExplorer={
                  () => {
                        const url =
                          chainId === 202555 || chainId === 167012
                            ? 'https://explorer.kasplex.org/token/0x2c2Ae87Ba178F48637acAe54B87c3924F544a83e'
                            : chainId === 38836 || chainId === 38833
                              ? 'https://explorer.igralabs.com/token/0x17Ec7E1768c813E2a3a9b0f94A35605CA520C242'
                              : explorerUrl;
                        if (url) window.open(url, '_blank', 'noopener,noreferrer');
                        setIsDropdownOpen(false);
                      }
                }
              />

              <div className="px-4 pb-3">
                <div className="grid grid-cols-2 gap-2">
                  <WalletMiniCard
                    title={chainId === 38836 ? 'tKREX' : 'KREX'}
                    value={
                      isBalanceVisible
                        ? (isKrexLoading ? '…' : krexL2Balance.toLocaleString(undefined, { maximumFractionDigits: 2 }))
                        : '***'
                    }
                    sub={`Tier: ${tierForChain}`}
                    onClick={() => {
                      setIsDropdownOpen(false);
                      router.push('/tokens/krex');
                    }}
                  />
                  <WalletMiniCard
                    title={isTestnet ? 'tGRID' : 'GRID'}
                    value={
                      gridTokenAddress
                        ? (isBalanceVisible ? (isGridLoading ? '…' : gridFormatted) : '***')
                        : '—'
                    }
                    sub={gridTokenAddress ? undefined : 'Not deployed'}
                    onClick={() => {
                      setIsDropdownOpen(false);
                      router.push('/tokens/grid');
                    }}
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
                        'Opens perks for your Total tier: multiplier, fees, and points on L2.',
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
                    <span className="text-zinc-500 dark:text-zinc-400">Fee reduction</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">-{KREX_TIERS[krexTier].feeReduction}%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 dark:text-zinc-400">XP Points</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{xpPoints.toLocaleString()}</span>
                  </div>
                  <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500 dark:text-zinc-400">NFTs (L2 bridged)</span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">—</span>
                    </div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-500 mt-1">
                      L1 NFTs are not shown here.
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        window.open(BRIDGE_URLS.nftBridge, '_blank', 'noopener,noreferrer');
                        setIsDropdownOpen(false);
                      }}
                      className="w-full mt-2 px-3 py-2 text-xs font-bold text-center bg-[#02abb8] hover:bg-[#028a94] text-white rounded-xl transition-colors"
                    >
                      Buy/Bridge NFTs
                    </button>
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
                      <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">—</div>
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
                    onClick={() => setIsHelpOpen(true)}
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
          networkName={networkLabel}
          nativeSymbol={uiNative}
          links={[
            { label: `Buy/Bridge ${uiNative}`, url: getNetworkBridgeUrl(chainId), variant: 'primary' },
            { label: 'Bridge KRC20 (KREX)', url: BRIDGE_URLS.katBridge, variant: 'secondary' },
            { label: 'NFT Bridge', url: BRIDGE_URLS.nftBridge, variant: 'secondary' },
          ]}
          primaryAction={{
            label: 'Open bridge',
            onClick: () => {
              setIsBridgeInfoOpen(false);
              setIsDropdownOpen(false);
              window.open(getNetworkBridgeUrl(chainId), '_blank', 'noopener,noreferrer');
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
        <SendL2TransactionModal isOpen={isSendOpen} onClose={() => setIsSendOpen(false)} />
        <KREXBuyWizard isOpen={isKrexBuyWizardOpen} onClose={() => setIsKrexBuyWizardOpen(false)} />
        <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} title="Help (L2)" />
        <RewardsModal isOpen={isRewardsOpen} onClose={() => setIsRewardsOpen(false)} currentTier={krexTier} krexBalance={krexL2Balance} title="Rewards (L2)" />
        <NodeStatusModal isOpen={isNodeOpen} onClose={() => setIsNodeOpen(false)} title="Node status (L2)" />
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
