/**
 * Token Promo Section
 * 
 * Displays promo engine CTA and stats on token landing page
 */

'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import type { Token } from '@/lib/tokens/types';

interface TokenPromoSectionProps {
  token: Token;
  apiBaseUrl?: string;
}

interface PromoStats {
  totalPages: number;
  totalMints: number;
  totalVolume: number;
}

export function TokenPromoSection({ token, apiBaseUrl = 'https://kasparex-api.kasparexcom.workers.dev' }: TokenPromoSectionProps) {
  const { address, isConnected } = useAccount();
  const [stats, setStats] = useState<PromoStats | null>(null);
  const [userPageId, setUserPageId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        // Get token stats
        const response = await fetch(`${apiBaseUrl}/kasparex/promo/token/${token.id}`);
        if (response.ok) {
          const data = await response.json();
          setStats(data.stats);
        }

        // Get user's page if connected
        if (isConnected && address) {
          const pageResponse = await fetch(`${apiBaseUrl}/kasparex/promo/page-by-owner/${token.id}/${address}`);
          if (pageResponse.ok) {
            const pageData = await pageResponse.json();
            if (pageData.page) {
              setUserPageId(pageData.page.id);
            }
          }
        }
      } catch (err) {
        console.error('Error loading promo stats:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, [token.id, isConnected, address, apiBaseUrl]);

  // Check if token has promo engine (for now, check if it's L2 and has a contract)
  const hasPromoEngine = token.network === 'L2' && token.contractAddress;

  if (!hasPromoEngine) {
    return null;
  }

  const promoPageUrl = userPageId 
    ? `/tokens/${token.slug}/promo/${userPageId}`
    : `/tokens/${token.slug}/promo/genesis`; // Fallback to genesis page

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Promotion Engine
        </h2>
        {isConnected && userPageId && (
          <Link
            href={promoPageUrl}
            className="px-4 py-2 bg-[#02abb8] text-white rounded-lg hover:bg-[#028a94] transition-colors text-sm font-medium"
          >
            Your Promo Page
          </Link>
        )}
      </div>

      <p className="text-zinc-600 dark:text-zinc-400 mb-6">
        Mint tokens and promote them through rotating slot positions. Each mint shares revenue across the 5 page wallets and rotates slots automatically.
      </p>

      {!isLoading && stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
            <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Total Pages</div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stats.totalPages}</div>
          </div>
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
            <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Total Mints</div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stats.totalMints}</div>
          </div>
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
            <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Total Volume</div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {stats.totalVolume.toFixed(2)} KAS
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-4">
        {isConnected ? (
          <Link
            href={promoPageUrl}
            className="px-6 py-3 bg-[#02abb8] text-white rounded-lg font-medium hover:bg-[#028a94] transition-colors"
          >
            {userPageId ? 'View Your Promo Page' : 'Mint and Promote'}
          </Link>
        ) : (
          <div className="px-6 py-3 bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 rounded-lg font-medium">
            Connect Wallet to Mint
          </div>
        )}
      </div>
    </div>
  );
}
