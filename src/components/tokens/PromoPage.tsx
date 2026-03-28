/**
 * Promo Page Component
 * 
 * Displays a token promo page with slots, mint panel, and analytics
 */

'use client';

import { useState, useEffect } from 'react';
import { useAccount, useChainId, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther, formatEther, keccak256, stringToHex, type Address } from 'viem';
import { PROMO_MINT_ROUTER_ABI } from '@/lib/contracts/abis';
import { getContractAddress } from '@/lib/contracts/addresses';
import { CHAIN_IDS } from '@/lib/wagmi';
import type { Token } from '@/lib/tokens/types';
import { PromoRiskNotice } from './PromoRiskNotice';
import { MintInfoBox } from './MintInfoBox';
import { SlotRewardsInfoBox } from './SlotRewardsInfoBox';

interface PromoPage {
  id: string;
  token_id: string;
  owner_wallet: string;
  slot1_wallet: string;
  slot2_wallet: string;
  slot3_wallet: string;
  slot4_wallet: string;
  slot5_wallet: string;
  slot1_label?: string;
  slot2_label?: string;
  slot3_label?: string;
  slot4_label?: string;
  slot5_label?: string;
  status: string;
  total_mints: number;
  total_volume: number;
  earn_slot1: number;
  earn_slot2: number;
  earn_slot3: number;
  earn_slot4: number;
  earn_slot5: number;
}

interface TokenConfig {
  mint_price: number;
  tokens_per_mint: number;
  mintable_supply: number;
  minted_so_far: number;
  status: string;
  creator_wallet: string;
  platform_wallet: string;
  slotBps?: number[]; // Revenue split percentages for slots (basis points)
}

interface PromoPageProps {
  token: Token;
  pageId: string;
  apiBaseUrl?: string;
}

export function PromoPage({ token, pageId, apiBaseUrl = 'https://kasparex-api.kasparexcom.workers.dev' }: PromoPageProps) {
  // Ensure apiBaseUrl doesn't have a trailing slash
  const baseUrl = apiBaseUrl.replace(/\/$/, '');

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [page, setPage] = useState<PromoPage | null>(null);
  const [tokenConfig, setTokenConfig] = useState<TokenConfig | null>(null);
  const [mintCount, setMintCount] = useState(1);
  const [cooldownRemaining, setCooldownRemaining] = useState<number | null>(null);
  const [rateLimitStatus, setRateLimitStatus] = useState<{ dailyMints: number; remainingMints: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const routerAddress = getContractAddress(chainId, 'PromoMintRouter') as Address | undefined;
  const isIgraMainnet = chainId === CHAIN_IDS.IGRA_MAINNET;

  // Load page data
  useEffect(() => {
    if (!pageId) return;

    const loadPage = async () => {
      try {
        const url = `${baseUrl}/kasparex/promo/page/${pageId}`;
        console.log('[PromoPage] Fetching page data from:', url);
        const response = await fetch(url);

        if (!response.ok) throw new Error('Failed to load page');
        const data = await response.json();
        setPage(data.page);

        // Load token config from database
        const tokenUrl = `${baseUrl}/kasparex/promo/token/${data.page.token_id}`;
        console.log('[PromoPage] Fetching token config from:', tokenUrl);
        const tokenResponse = await fetch(tokenUrl);

        if (tokenResponse.ok) {
          const tokenData = await tokenResponse.json();
          setTokenConfig(tokenData.token);
        }
      } catch (err) {
        console.error('Error loading page:', err);
        setError('Failed to load promo page');
      } finally {
        setIsLoading(false);
      }
    };

    loadPage();
  }, [pageId, baseUrl]);

  // Load cooldown and rate limit status
  useEffect(() => {
    if (!isConnected || !address) return;

    const loadStatus = async () => {
      try {
        const cooldownUrl = `${baseUrl}/kasparex/promo/cooldown-status/${address}`;
        const rateLimitUrl = `${baseUrl}/kasparex/promo/rate-limit-status/${address}`;

        const [cooldownRes, rateLimitRes] = await Promise.all([
          fetch(cooldownUrl),
          fetch(rateLimitUrl),
        ]);


        if (cooldownRes.ok) {
          const cooldownData = await cooldownRes.json();
          if (cooldownData.retryAfter) {
            setCooldownRemaining(cooldownData.retryAfter);
          }
        }

        if (rateLimitRes.ok) {
          const rateLimitData = await rateLimitRes.json();
          setRateLimitStatus({
            dailyMints: rateLimitData.dailyMints || 0,
            remainingMints: rateLimitData.remainingMints || 10,
          });
        }
      } catch (err) {
        console.error('Error loading status:', err);
      }
    };

    loadStatus();
    const interval = setInterval(loadStatus, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [isConnected, address, apiBaseUrl]);

  // Cooldown countdown
  useEffect(() => {
    if (cooldownRemaining === null || cooldownRemaining <= 0) return;

    const timer = setInterval(() => {
      setCooldownRemaining((prev) => (prev && prev > 0 ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldownRemaining]);

  // Read wallet security from contract
  const { data: walletSecurity } = useReadContract({
    address: routerAddress,
    abi: PROMO_MINT_ROUTER_ABI,
    functionName: 'getWalletSecurity',
    args: address ? [address] : undefined,
    query: {
      enabled: !!routerAddress && !!address && isIgraMainnet,
    },
  });

  const { data: contractCooldown } = useReadContract({
    address: routerAddress,
    abi: PROMO_MINT_ROUTER_ABI,
    functionName: 'cooldownSeconds',
    query: {
      enabled: !!routerAddress && isIgraMainnet,
    },
  });

  // Read token config from contract to get revenue split percentages and mint price
  const tokenIdBytes = token ? keccak256(stringToHex(token.id)) as `0x${string}` : undefined;
  const { data: contractTokenConfig } = useReadContract({
    address: routerAddress,
    abi: PROMO_MINT_ROUTER_ABI,
    functionName: 'getTokenConfig',
    args: tokenIdBytes ? [tokenIdBytes] : undefined,
    query: {
      enabled: !!routerAddress && !!tokenIdBytes && isIgraMainnet,
    },
  });

  const { writeContract, data: txHash, isPending: isMinting } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const handleMint = async () => {
    if (!isConnected || !address || !page || !tokenConfig || !routerAddress) {
      setError('Please connect wallet');
      return;
    }

    if (!isIgraMainnet) {
      setError('Please switch to Igra Caravel Testnet');
      return;
    }

    if (cooldownRemaining && cooldownRemaining > 0) {
      setError(`Cooldown active. Please wait ${cooldownRemaining} seconds`);
      return;
    }

    if (rateLimitStatus && rateLimitStatus.remainingMints < mintCount) {
      setError(`Daily limit reached. Only ${rateLimitStatus.remainingMints} mints remaining`);
      return;
    }

    try {
      // Convert token ID and page ID to bytes32 using keccak256 hash
      // This matches the format used in token registration (keccak256 of string)
      const tokenIdBytes = keccak256(stringToHex(token.id)) as `0x${string}`;
      const pageIdBytes = keccak256(stringToHex(page.id)) as `0x${string}`;
      // Slots array must be a fixed-size tuple [Address, Address, Address, Address, Address]
      const slots: [Address, Address, Address, Address, Address] = [
        page.slot1_wallet as Address,
        page.slot2_wallet as Address,
        page.slot3_wallet as Address,
        page.slot4_wallet as Address,
        page.slot5_wallet as Address,
      ];
      // Use contract price if available, otherwise fall back to database price
      const currentMintPrice = contractTokenConfig?.mintPrice
        ? parseFloat(formatEther(contractTokenConfig.mintPrice))
        : tokenConfig.mint_price;
      const totalPrice = parseEther((currentMintPrice * mintCount).toString());

      writeContract({
        address: routerAddress,
        abi: PROMO_MINT_ROUTER_ABI,
        functionName: 'mint',
        args: [tokenIdBytes, pageIdBytes, BigInt(mintCount), slots],
        value: totalPrice,
      });
    } catch (err) {
      console.error('Mint error:', err);
      setError(err instanceof Error ? err.message : 'Mint failed');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-zinc-600 dark:text-zinc-400">Loading promo page...</div>
      </div>
    );
  }

  if (!page || !tokenConfig) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-600 dark:text-red-400">Failed to load promo page</div>
      </div>
    );
  }

  // Get revenue split percentages from contract (basis points)
  const slotBps = contractTokenConfig?.slotBps || [4000, 1000, 500, 200, 100]; // Default percentages if not loaded
  const slotPercentages = slotBps.map(bps => bps / 100); // Convert basis points to percentages

  // Use contract price if available, otherwise fall back to database price
  const mintPrice = contractTokenConfig?.mintPrice
    ? parseFloat(formatEther(contractTokenConfig.mintPrice))
    : tokenConfig.mint_price;

  const slots = [
    { wallet: page.slot1_wallet, label: page.slot1_label || 'Slot 1', earnings: page.earn_slot1, percentage: slotPercentages[0], isActive: true },
    { wallet: page.slot2_wallet, label: page.slot2_label || 'Slot 2', earnings: page.earn_slot2, percentage: slotPercentages[1], isActive: false },
    { wallet: page.slot3_wallet, label: page.slot3_label || 'Slot 3', earnings: page.earn_slot3, percentage: slotPercentages[2], isActive: false },
    { wallet: page.slot4_wallet, label: page.slot4_label || 'Slot 4', earnings: page.earn_slot4, percentage: slotPercentages[3], isActive: false },
    { wallet: page.slot5_wallet, label: page.slot5_label || 'Slot 5', earnings: page.earn_slot5, percentage: slotPercentages[4], isActive: false },
  ];

  const totalPrice = mintPrice * mintCount;
  const canMint = isConnected &&
    address && // Check address is available
    isIgraMainnet &&
    (!cooldownRemaining || cooldownRemaining <= 0) &&
    (!rateLimitStatus || rateLimitStatus.remainingMints >= mintCount) &&
    tokenConfig.status === 'ACTIVE';

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {isConfirmed && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="text-sm text-green-800 dark:text-green-200">
            Mint successful! Transaction: {txHash?.slice(0, 10)}...
          </p>
        </div>
      )}

      {/* Slot Rewards Panel - Table Format */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 p-6">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">Promotion Slots</h2>
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
                <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Slot
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Wallet Address
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Revenue Split
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Earned
                </th>
              </tr>
            </thead>
            <tbody>
              {slots.map((slot, idx) => (
                <tr
                  key={idx}
                  className={`border-b border-zinc-200 dark:border-zinc-800 transition-colors ${slot.isActive
                    ? 'bg-[#02abb8]/10 dark:bg-[#02abb8]/20 hover:bg-[#02abb8]/20 dark:hover:bg-[#02abb8]/30'
                    : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                    }`}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {slot.label}
                      </span>
                      {slot.isActive && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-[#02abb8] text-white rounded">
                          Active
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm font-mono text-zinc-900 dark:text-zinc-100">
                      {slot.wallet}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {slot.percentage.toFixed(2)}%
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">
                      {slot.earnings.toFixed(4)} KAS
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mint Panel */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 p-6">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">Mint Tokens</h2>

        {/* Cooldown Display */}
        {cooldownRemaining && cooldownRemaining > 0 && (
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Cooldown active. You can mint again in {cooldownRemaining} seconds.
            </p>
          </div>
        )}

        {/* Rate Limit Display */}
        {rateLimitStatus && (
          <div className="mb-4 p-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg">
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              Daily mints: {rateLimitStatus.dailyMints} / 10 ({rateLimitStatus.remainingMints} remaining)
            </p>
          </div>
        )}

        {/* Amount Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Mint Count
          </label>
          <div className="flex gap-2">
            {[1, 2, 5, 10].map((count) => (
              <button
                key={count}
                onClick={() => setMintCount(count)}
                className={`px-4 py-2 rounded-lg border transition-colors ${mintCount === count
                  ? 'bg-[#02abb8] text-white border-[#02abb8]'
                  : 'bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100'
                  }`}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        {/* Price Display */}
        <div className="mb-4 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Price per Mint</span>
            <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {mintPrice.toFixed(2)} KAS
            </span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Total Price</span>
            <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {totalPrice.toFixed(2)} KAS
            </span>
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-500">
            {mintCount} × {tokenConfig.tokens_per_mint} tokens = {mintCount * tokenConfig.tokens_per_mint} tokens
          </div>
        </div>

        {/* Mint Button */}
        <button
          onClick={handleMint}
          disabled={!canMint || isMinting || isConfirming}
          className="w-full px-6 py-3 bg-[#02abb8] text-white rounded-lg font-medium hover:bg-[#028a94] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isMinting || isConfirming ? 'Processing...' : 'Mint Tokens'}
        </button>

        {!isConnected && (
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 text-center">
            Please connect your wallet
          </p>
        )}
        {!isIgraMainnet && isConnected && (
          <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-400 text-center">
            Please switch to Igra Caravel Testnet
          </p>
        )}
      </div>

      {/* Analytics */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 p-6">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">Page Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
            <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Total Mints</div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{page.total_mints}</div>
          </div>
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
            <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Total Volume</div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {page.total_volume.toFixed(2)} KAS
            </div>
          </div>
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
            <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Supply Progress</div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {tokenConfig.minted_so_far} / {tokenConfig.mintable_supply}
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimers */}
      <PromoRiskNotice />
      {tokenConfig && (
        <MintInfoBox mintPrice={mintPrice} tokensPerMint={tokenConfig.tokens_per_mint} />
      )}
      <SlotRewardsInfoBox />

      {/* Security Notice */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          This system uses rate limiting to ensure fair access for all users. Bots and automated scripts are not permitted.
        </p>
      </div>
    </div>
  );
}
