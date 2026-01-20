/**
 * Promo Page Component
 * 
 * Displays a token promo page with slots, mint panel, and analytics
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useAccount, useChainId, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther, formatEther, keccak256, toUtf8Bytes, type Address } from 'viem';
// ReCAPTCHA is optional - try to import, but don't fail if package is not installed
let ReCAPTCHA: any = null;
try {
  ReCAPTCHA = require('react-google-recaptcha')?.default;
} catch (e) {
  // Package not installed - will work without it
}
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
}

interface PromoPageProps {
  token: Token;
  pageId: string;
  apiBaseUrl?: string;
}

export function PromoPage({ token, pageId, apiBaseUrl = 'https://kasparex-api.kasparexcom.workers.dev' }: PromoPageProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [page, setPage] = useState<PromoPage | null>(null);
  const [tokenConfig, setTokenConfig] = useState<TokenConfig | null>(null);
  const [mintCount, setMintCount] = useState(1);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState<number | null>(null);
  const [rateLimitStatus, setRateLimitStatus] = useState<{ dailyMints: number; remainingMints: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifyingRecaptcha, setIsVerifyingRecaptcha] = useState(false);
  const recaptchaRef = useRef<any>(null);
  
  // Get reCAPTCHA site key from environment
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '';
  const hasRecaptcha = !!ReCAPTCHA && !!recaptchaSiteKey;

  const routerAddress = getContractAddress(chainId, 'PromoMintRouter') as Address | undefined;
  const isIgraTestnet = chainId === CHAIN_IDS.IGRA_CARAVEL_TESTNET;

  // Load page data
  useEffect(() => {
    if (!pageId) return;

    const loadPage = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/kasparex/promo/page/${pageId}`);
        if (!response.ok) throw new Error('Failed to load page');
        const data = await response.json();
        setPage(data.page);
        
        // Load token config
        const tokenResponse = await fetch(`${apiBaseUrl}/kasparex/promo/token/${data.page.token_id}`);
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
  }, [pageId, apiBaseUrl]);

  // Load cooldown and rate limit status
  useEffect(() => {
    if (!isConnected || !address) return;

    const loadStatus = async () => {
      try {
        const [cooldownRes, rateLimitRes] = await Promise.all([
          fetch(`${apiBaseUrl}/kasparex/promo/cooldown-status/${address}`),
          fetch(`${apiBaseUrl}/kasparex/promo/rate-limit-status/${address}`),
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
      enabled: !!routerAddress && !!address && isIgraTestnet,
    },
  });

  const { data: contractCooldown } = useReadContract({
    address: routerAddress,
    abi: PROMO_MINT_ROUTER_ABI,
    functionName: 'cooldownSeconds',
    query: {
      enabled: !!routerAddress && isIgraTestnet,
    },
  });

  const { writeContract, data: txHash, isPending: isMinting } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Handle reCAPTCHA verification (optional)
  const handleRecaptchaChange = async (token: string | null) => {
    if (!hasRecaptcha) {
      // If reCAPTCHA not available, auto-generate session token
      if (token && address) {
        const mockSessionToken = `session_${address.slice(0, 10)}_${Date.now()}`;
        setSessionToken(mockSessionToken);
      }
      return;
    }

    if (!token) {
      setRecaptchaToken(null);
      setSessionToken(null);
      return;
    }

    if (!address) {
      setError('Please connect your wallet first');
      recaptchaRef.current?.reset();
      return;
    }

    setRecaptchaToken(token);
    setIsVerifyingRecaptcha(true);
    setError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/kasparex/promo/verify-recaptcha`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recaptchaToken: token,
          walletAddress: address,
          tokenId: page?.token_id || token.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'reCAPTCHA verification failed' }));
        throw new Error(errorData.error || 'reCAPTCHA verification failed');
      }

      const data = await response.json();
      setSessionToken(data.sessionToken);
    } catch (err) {
      console.error('reCAPTCHA error:', err);
      setError(err instanceof Error ? err.message : 'reCAPTCHA verification failed');
      setRecaptchaToken(null);
      recaptchaRef.current?.reset();
    } finally {
      setIsVerifyingRecaptcha(false);
    }
  };

  // Auto-generate session token if reCAPTCHA not available
  useEffect(() => {
    if (!hasRecaptcha && isConnected && address && !sessionToken) {
      const mockSessionToken = `session_${address.slice(0, 10)}_${Date.now()}`;
      setSessionToken(mockSessionToken);
    }
  }, [hasRecaptcha, isConnected, address, sessionToken]);

  // Reset when wallet disconnects
  useEffect(() => {
    if (!isConnected) {
      setRecaptchaToken(null);
      setSessionToken(null);
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
    }
  }, [isConnected]);

  const handleMint = async () => {
    if (!isConnected || !address || !page || !tokenConfig || !routerAddress || !sessionToken) {
      setError('Please connect wallet and complete reCAPTCHA');
      return;
    }

    if (!isIgraTestnet) {
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
      const tokenIdBytes = keccak256(toUtf8Bytes(token.id)) as `0x${string}`;
      const pageIdBytes = keccak256(toUtf8Bytes(page.id)) as `0x${string}`;
      const slots: Address[] = [
        page.slot1_wallet as Address,
        page.slot2_wallet as Address,
        page.slot3_wallet as Address,
        page.slot4_wallet as Address,
        page.slot5_wallet as Address,
      ];
      const totalPrice = parseEther((tokenConfig.mint_price * mintCount).toString());

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

  const slots = [
    { wallet: page.slot1_wallet, label: page.slot1_label || 'Slot 1', earnings: page.earn_slot1 },
    { wallet: page.slot2_wallet, label: page.slot2_label || 'Slot 2', earnings: page.earn_slot2 },
    { wallet: page.slot3_wallet, label: page.slot3_label || 'Slot 3', earnings: page.earn_slot3 },
    { wallet: page.slot4_wallet, label: page.slot4_label || 'Slot 4', earnings: page.earn_slot4 },
    { wallet: page.slot5_wallet, label: page.slot5_label || 'Slot 5', earnings: page.earn_slot5 },
  ];

  const totalPrice = tokenConfig.mint_price * mintCount;
  const canMint = isConnected && 
    isIgraTestnet && 
    sessionToken && 
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

      {/* Slot Rewards Panel */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 p-6">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">Promotion Slots</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {slots.map((slot, idx) => (
            <div
              key={idx}
              className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700"
            >
              <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                {slot.label}
              </div>
              <div className="text-sm font-mono text-zinc-900 dark:text-zinc-100 truncate mb-2">
                {slot.wallet.slice(0, 6)}...{slot.wallet.slice(-4)}
              </div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                Earned: {slot.earnings.toFixed(4)} KAS
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mint Panel */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 p-6">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">Mint Tokens</h2>

        {/* reCAPTCHA (optional) */}
        {hasRecaptcha && !sessionToken && isConnected && (
          <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
              Please complete reCAPTCHA verification to continue
            </p>
            <div className="flex justify-center">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={recaptchaSiteKey}
                onChange={handleRecaptchaChange}
                theme="light"
              />
            </div>
            {isVerifyingRecaptcha && (
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-2 text-center">
                Verifying...
              </p>
            )}
          </div>
        )}

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
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  mintCount === count
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
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Total Price</span>
            <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {totalPrice.toFixed(4)} KAS
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
        {!isIgraTestnet && isConnected && (
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
        <MintInfoBox mintPrice={tokenConfig.mint_price} tokensPerMint={tokenConfig.tokens_per_mint} />
      )}
      <SlotRewardsInfoBox />

      {/* Security Notice */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          This system uses reCAPTCHA and rate limiting to ensure fair access for all users. Bots and automated scripts are not permitted.
        </p>
      </div>
    </div>
  );
}


      {/* Security Notice */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          This system uses reCAPTCHA and rate limiting to ensure fair access for all users. Bots and automated scripts are not permitted.
        </p>
      </div>
    </div>
  );
}
