'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAccount, useChainId } from 'wagmi';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { getNativeCurrencySymbol } from '@/lib/wagmi';
import { SidebarHeader } from '@/components/sidebar/SidebarHeader';
import { SidebarCategories } from '@/components/sidebar/SidebarCategories';
import { RevenueTreeContentType } from '@/lib/revenue-tree/types';
import { RevenueTreeGuideModal } from './RevenueTreeGuideModal';
import { RevenueTreeActivationBox } from './RevenueTreeActivationBox';

interface RevenueTreeSidebarProps {
  totalRevenue: number;
  activeTrees: number;
  totalDownline: number;
  /** Optional override address (for viewing public profiles) */
  address?: string;
}

export function RevenueTreeSidebar({
  totalRevenue,
  activeTrees,
  totalDownline,
  address: propAddress,
}: RevenueTreeSidebarProps) {
  const pathname = usePathname();
  const chainId = useChainId();
  const { address: connectedAddress } = useAccount();
  const address = propAddress || connectedAddress;
  const nativeSymbol = getNativeCurrencySymbol(chainId);
  const [showGuide, setShowGuide] = useState(false);

  const flowHref = useMemo(
    () => (address ? `/tree/${address}` : '/tree/dashboard'),
    [address]
  );

  const tabItems = [
    { id: 'all', label: 'All Trees', count: activeTrees },
    { id: 'dapp', label: 'dApps', count: 0 },
    { id: 'vblog', label: 'vBlog', count: 0 },
    { id: 'game', label: 'Games', count: 0 },
  ];

  const handleCopyLink = () => {
    if (!address) return;
    const domain = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${domain}/tree?ref=${address}`;
    navigator.clipboard.writeText(link);
    // In a deeper implementation, could trigger a toast notification here.
  };

  const quickLinks = [
    {
      id: 'dashboard',
      label: 'My Dashboard',
      href: '/tree/dashboard',
      icon: (
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      id: 'flow',
      label: 'Tree Flow',
      href: flowHref,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      ),
    },
    {
      id: 'demo',
      label: 'How It Works',
      href: '/tree/demo',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <>
      <UnifiedSidebar
        storageKeyPrefix="revenue-tree"
        header={(onHide) => (
          <SidebarHeader
            backHref="/"
            backLabel="Back to dApps"
            onHide={onHide}
          />
        )}
      >
        {/* Quick Links — at top */}
        <div className="mb-6">
          <div className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3 px-1">
            Quick Links
          </div>
          <nav className="space-y-0.5">
            {quickLinks.map((link) => {
              const isActive = link.id === 'flow' 
                ? (pathname.startsWith('/tree/') && pathname !== '/tree/dashboard' && pathname !== '/tree/demo') 
                : pathname === link.href;
              return (
                <Link
                  key={link.id}
                  href={link.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                    ? 'bg-[#02abb8]/10 text-[#02abb8] border border-[#02abb8]/20'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
                    }`}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Quick Stats */}
        <div className="mb-6 p-4 bg-gradient-to-br from-[#02abb8]/10 to-purple-500/10 rounded-xl border border-[#02abb8]/20">
          <div className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
            Quick Stats
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-600 dark:text-zinc-400">Total Revenue</span>
              <span className="text-sm font-black text-[#02abb8]">{totalRevenue.toFixed(2)} {nativeSymbol}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-600 dark:text-zinc-400">Active Trees</span>
              <span className="text-sm font-black text-green-600 dark:text-green-400">{activeTrees}</span>
            </div>
          </div>
        </div>

        {/* Network Growth Block */}
        <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700">
          <div className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
            Grow Your Tree
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-3">
            Share your link. You&apos;ll become L1 (earning 2%) in your friend&apos;s trees forever!
          </p>
          <button
            onClick={handleCopyLink}
            disabled={!address}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:border-[#02abb8] dark:hover:border-[#02abb8] text-zinc-900 dark:text-white rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4 text-[#02abb8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {address ? 'Copy Invite Link' : 'Connect Wallet'}
          </button>
        </div>

        {/* Activation Progress */}
        <div className="mb-6">
          <RevenueTreeActivationBox address={address} />
        </div>

        {/* Guide Button */}
        <button
          onClick={() => setShowGuide(true)}
          className="w-full mt-6 px-4 py-3 bg-gradient-to-r from-[#02abb8] to-purple-500 hover:from-[#0299a6] hover:to-purple-600 text-white font-black text-sm uppercase tracking-wider rounded-lg transition-all shadow-lg shadow-[#02abb8]/20"
        >
          <div className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            View Guide
          </div>
        </button>
      </UnifiedSidebar>

      <RevenueTreeGuideModal isOpen={showGuide} onClose={() => setShowGuide(false)} />
    </>
  );
}
