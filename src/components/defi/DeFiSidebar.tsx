'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { SidebarHeader } from '@/components/sidebar/SidebarHeader';
import { SidebarNavItem } from '@/components/sidebar/SidebarNavItem';
import { Suspense } from 'react';

function DeFiSidebarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');

  return (
    <UnifiedSidebar
      storageKeyPrefix="defi"
      header={(onHide) => (
        <SidebarHeader 
          backHref="/hub" 
          backLabel="Back to Hub" 
          onHide={onHide} 
        />
      )}
    >
      <div className="space-y-1">
        <SidebarNavItem
          label="Swaps"
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          }
          href="/defi/swaps"
          active={pathname === '/defi/swaps' && !tab}
        />
        <SidebarNavItem
          label="Liquidity"
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          }
          href="/defi/swaps?tab=liquidity"
          active={tab === 'liquidity'}
        />
        <div className="pt-4 pb-2 px-3">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600">
            Portfolio
          </span>
        </div>
        <SidebarNavItem
          label="My Assets"
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          }
          className="opacity-50 cursor-not-allowed"
          onClick={() => {}}
        />
        <SidebarNavItem
          label="Staking"
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
          className="opacity-50 cursor-not-allowed"
          onClick={() => {}}
        />
      </div>

      <div className="mt-8 pt-8 border-t border-zinc-200 dark:border-zinc-800">
        <div className="bg-gradient-to-br from-violet-500/10 to-amber-500/10 p-4 rounded-xl border border-violet-500/20">
          <p className="text-[10px] font-bold text-violet-700 dark:text-violet-400 uppercase tracking-widest mb-2">
            Tip
          </p>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Connect your wallet to see personalized yields and portfolio stats.
          </p>
        </div>
      </div>
    </UnifiedSidebar>
  );
}

export function DeFiSidebar() {
  return (
    <Suspense fallback={<div className="w-64 h-screen bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800" />}>
      <DeFiSidebarContent />
    </Suspense>
  );
}
