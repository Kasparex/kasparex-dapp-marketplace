'use client';

import { useState } from 'react';
import { useChainId } from 'wagmi';
import { RevenueTreeLevel as RevenueTreeLevelType } from '@/lib/revenue-tree/types';
import { getNativeCurrencySymbol } from '@/lib/wagmi';

interface RevenueTreeLevelModalProps {
  level: RevenueTreeLevelType;
  isOpen: boolean;
  onClose: () => void;
  isCurrentUser?: boolean;
  contentType: 'dapp' | 'magazine' | 'vblog' | 'game' | 'store';
  contentSlug: string;
}

export function RevenueTreeLevelModal({
  level,
  isOpen,
  onClose,
  isCurrentUser = false,
  contentType,
  contentSlug,
}: RevenueTreeLevelModalProps) {
  const chainId = useChainId();
  const nativeSymbol = getNativeCurrencySymbol(chainId);
  const [copied, setCopied] = useState(false);
  const [referralLinksCopied, setReferralLinksCopied] = useState<{ [key: string]: boolean }>({});

  if (!isOpen) return null;

  const formatAddress = (address: string) => {
    if (address.startsWith('kaspa:')) {
      const parts = address.split('...');
      if (parts.length > 1) {
        return address;
      }
      return `${address.slice(0, 10)}...${address.slice(-4)}`;
    }
    if (address.startsWith('0x')) {
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
    return address;
  };

  const fullAddress = level.walletAddress;
  const displayAddress = formatAddress(fullAddress);

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(fullAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleCopyReferralLink = async (walletAddress: string) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    let path: string;
    if (contentType === 'magazine') {
      path = `/magazines/${contentSlug}/1`; // TODO: Get actual issue number
    } else {
      const pluralMap: Record<'dapp' | 'magazine' | 'vblog' | 'game' | 'store', string> = {
        dapp: 'dapps',
        magazine: 'magazines',
        vblog: 'vblog',
        game: 'games',
        store: 'store',
      };
      path = `/${pluralMap[contentType]}/${contentSlug}`;
    }
    const referralLink = `${baseUrl}${path}?ref=${walletAddress}`;
    
    try {
      await navigator.clipboard.writeText(referralLink);
      setReferralLinksCopied({ ...referralLinksCopied, [walletAddress]: true });
      setTimeout(() => {
        setReferralLinksCopied({ ...referralLinksCopied, [walletAddress]: false });
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Mock referral links for users who activated (in production, this would come from backend)
  const mockReferralLinks: string[] = []; // TODO: Fetch from backend

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 mb-1">
                Level {level.level} Details
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Revenue share: {level.sharePercentage}% • {level.userCount} referred users
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <svg className="w-6 h-6 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Wallet Address Section */}
          <div>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest mb-3">
              Wallet Address
            </h4>
            <div className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-mono text-zinc-900 dark:text-zinc-100 break-all">
                  {fullAddress}
                </div>
              </div>
              <button
                onClick={handleCopyAddress}
                className="px-4 py-2 bg-[#02abb8] hover:bg-[#0299a6] text-white font-bold text-sm rounded-lg transition-colors flex items-center gap-2 flex-shrink-0"
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* User Count Section */}
          <div>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest mb-3">
              Referred Users
            </h4>
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <div className="text-3xl font-black text-yellow-600 dark:text-yellow-400 mb-1">
                {level.userCount}
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Users have activated their Revenue Tree through this level
              </div>
            </div>
          </div>

          {/* Logic Explanation */}
          <div>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest mb-3">
              How It Works
            </h4>
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
              <p>
                <strong className="font-bold">Level {level.level}</strong> receives{' '}
                <strong className="font-bold text-green-600 dark:text-green-400">{level.sharePercentage}%</strong> of
                all revenue generated from users in this Revenue Tree.
              </p>
              <p>
                When a user spends at least 100 {nativeSymbol} in this dApp, revenue is automatically
                distributed across all 5 levels according to their share percentages.
              </p>
              <p>
                This is a rotating revenue share system where each level moves up when new users activate their trees
                through referral links.
              </p>
            </div>
          </div>

          {/* Referral Links Section */}
          {mockReferralLinks.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest mb-3">
                Active Referral Links
              </h4>
              <div className="space-y-2">
                {mockReferralLinks.map((link, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-800"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-mono text-zinc-600 dark:text-zinc-400 truncate">
                        {link}
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopyReferralLink(link.split('ref=')[1] || '')}
                      className="px-3 py-1.5 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 font-bold text-xs rounded transition-colors flex-shrink-0"
                    >
                      {referralLinksCopied[link.split('ref=')[1] || ''] ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
