'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useResolveSidebarNavHref } from '@/hooks/useResolveSidebarNavHref';
import { XPPointsBox } from './XPPointsBox';
import { KREXStatusBox } from './KREXStatusBox';
import { NFTStatusBox } from './NFTStatusBox';
import { UnifiedStatusBox } from './UnifiedStatusBox';
import { UnifiedSidebar } from '../UnifiedSidebar';
import { SidebarHeader } from '../sidebar/SidebarHeader';
import { SidebarSection } from '../sidebar/SidebarSection';
import { SidebarNavItem } from '../sidebar/SidebarNavItem';

interface PointsSidebarProps {
  filters: {
    unlockedPerks: boolean;
    lockedPerks: boolean;
    unlockedBadges: boolean;
    lockedBadges: boolean;
    nftPerks: boolean;
    nodePerks: boolean;
  };
  onFilterChange: (filters: PointsSidebarProps['filters']) => void;
}

function RewardFilterIcon({ id, className = '' }: { id: string; className?: string }) {
  const iconProps = { className: `k-sidebar-icon ${className}`, strokeWidth: 2, fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' };
  switch (id) {
    case 'unlockedPerks': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>;
    case 'lockedPerks': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;
    case 'unlockedBadges': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
    case 'lockedBadges': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;
    case 'nftPerks': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
    case 'nodePerks': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" /></svg>;
    default: return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
  }
}

type FilterKey = keyof PointsSidebarProps['filters'];

export function PointsSidebar({ filters, onFilterChange }: PointsSidebarProps) {
  const pathname = usePathname();
  const toNav = useResolveSidebarNavHref();

  const handleFilterToggle = (key: FilterKey) => {
    onFilterChange({ ...filters, [key]: !filters[key] });
  };

  const handleReset = () => {
    onFilterChange({
      unlockedPerks: true,
      lockedPerks: true,
      unlockedBadges: true,
      lockedBadges: true,
      nftPerks: true,
      nodePerks: true,
    });
  };

  return (
    <UnifiedSidebar
      storageKeyPrefix="points"
      header={(onHide) => (
        <SidebarHeader backToMarketplace backLabel="Back to dApps" onHide={onHide} className="bg-white dark:bg-zinc-950" />
      )}
    >
      <div className="px-3 pt-3 pb-4 space-y-2 border-b border-zinc-200/70 dark:border-zinc-800/70 mb-4">
        <Link
          href="/leaderboard"
          className={`k-control-btn w-full justify-center gap-2 ${
            pathname.startsWith('/leaderboard')
              ? '!border-amber-500/40 !bg-amber-500/15 !text-amber-800 dark:!text-amber-300'
              : '!border-amber-500/30 !bg-amber-500/10 !text-amber-800 dark:!text-amber-300 hover:!bg-amber-500/15'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 21h8m-4 0v-4m6-14h2a2 2 0 012 2v1a6 6 0 01-6 6M6 3H4a2 2 0 00-2 2v1a6 6 0 006 6m10-9H6v5a6 6 0 006 6 6 6 0 006-6V3z"
            />
          </svg>
          <span className="text-xs font-black uppercase tracking-widest">Leaderboard</span>
        </Link>
        <Link
          href={toNav('/rewards')}
          className="k-control-btn w-full justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
          </svg>
          <span className="text-xs font-black uppercase tracking-widest">Rewards</span>
        </Link>
        <Link
          href="/points"
          className="k-control-btn w-full justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="text-xs font-black uppercase tracking-widest">Points</span>
        </Link>
        <Link
          href="/tiers"
          className="k-control-btn w-full justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="text-xs font-black uppercase tracking-widest">Tiers</span>
        </Link>
      </div>
      <SidebarSection title="Rewards Navigation">
        <nav className="space-y-0.5">
          <SidebarNavItem
            href="/rewards"
            label="Rewards Overview" 
            icon={<svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>}
            active={pathname.startsWith('/rewards')}
          />
          <SidebarNavItem 
            href="/tiers"
            label="Tiers & Multipliers" 
            icon={<svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
            active={pathname.startsWith('/tiers')}
          />
          <SidebarNavItem
            href="/rewards-calculator"
            label="Rewards Calculator"
            icon={<svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>}
            active={pathname.startsWith('/rewards-calculator')}
          />
        </nav>
      </SidebarSection>

      <UnifiedStatusBox />
      <XPPointsBox />
      <KREXStatusBox />
      <NFTStatusBox />

      <SidebarSection title="Perks">
        <nav className="space-y-0.5">
          <SidebarNavItem
            label="Unlocked Perks"
            icon={<RewardFilterIcon id="unlockedPerks" />}
            checked={filters.unlockedPerks}
            onCheckedChange={() => handleFilterToggle('unlockedPerks')}
          />
          <SidebarNavItem
            label="Locked Perks"
            icon={<RewardFilterIcon id="lockedPerks" />}
            checked={filters.lockedPerks}
            onCheckedChange={() => handleFilterToggle('lockedPerks')}
          />
        </nav>
      </SidebarSection>

      <SidebarSection title="Badges">
        <nav className="space-y-0.5">
          <SidebarNavItem
            label="Unlocked Badges"
            icon={<RewardFilterIcon id="unlockedBadges" />}
            checked={filters.unlockedBadges}
            onCheckedChange={() => handleFilterToggle('unlockedBadges')}
          />
          <SidebarNavItem
            label="Locked Badges"
            icon={<RewardFilterIcon id="lockedBadges" />}
            checked={filters.lockedBadges}
            onCheckedChange={() => handleFilterToggle('lockedBadges')}
          />
        </nav>
      </SidebarSection>

      <SidebarSection title="Additional">
        <nav className="space-y-0.5">
          <SidebarNavItem
            label="NFT Perks"
            icon={<RewardFilterIcon id="nftPerks" />}
            checked={filters.nftPerks}
            onCheckedChange={() => handleFilterToggle('nftPerks')}
          />
          <SidebarNavItem
            label="Node Perks"
            icon={<RewardFilterIcon id="nodePerks" />}
            checked={filters.nodePerks}
            onCheckedChange={() => handleFilterToggle('nodePerks')}
          />
        </nav>
      </SidebarSection>

      <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <button type="button" onClick={handleReset} className="w-full k-control-btn">
          Reset Filters
        </button>
      </div>

      <SidebarSection title="Related">
        <nav className="space-y-0.5">
          <Link
            href={toNav('/rewards-calculator')}
            className="k-sidebar-item w-full flex items-center gap-3"
          >
            <svg className="k-sidebar-icon w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span>Rewards Calculator</span>
          </Link>
          <Link
            href={toNav('/hub')}
            className="k-sidebar-item w-full flex items-center gap-3"
          >
            <svg className="k-sidebar-icon w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span>Hub</span>
          </Link>
        </nav>
      </SidebarSection>
    </UnifiedSidebar>
  );
}
  );
}
