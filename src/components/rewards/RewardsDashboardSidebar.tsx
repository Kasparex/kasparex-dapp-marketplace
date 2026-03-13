'use client';

import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { SidebarHeader } from '@/components/sidebar/SidebarHeader';
import { SidebarSection } from '@/components/sidebar/SidebarSection';

import { SidebarNavItem } from '@/components/sidebar/SidebarNavItem';

interface RewardsDashboardSidebarProps {
  filters: {
    types: ('krex-tier' | 'nft' | 'node' | 'premium')[];
    status: ('unlocked' | 'locked')[];
  };
  searchQuery: string;
  onFilterChange: (filters: RewardsDashboardSidebarProps['filters']) => void;
  onSearchChange: (query: string) => void;
}

const REWARD_SECTIONS = [
  { id: 'krex-tier-rewards', label: 'KREX Tier Rewards' },
  { id: 'nft-rewards', label: 'NFT Rewards' },
  { id: 'node-rewards', label: 'Node Rewards' },
  { id: 'premium-features', label: 'Premium Features' },
] as const;

export function RewardsDashboardSidebar({
  searchQuery,
  onSearchChange,
}: RewardsDashboardSidebarProps) {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <UnifiedSidebar
      storageKeyPrefix="rewards-dashboard"
      header={(onHide) => (
        <SidebarHeader
          backHref="/"
          backLabel="Back to Hub"
          onHide={onHide}
          className="bg-white dark:bg-zinc-950"
        />
      )}
      defaultWidth={256}
    >
      <SidebarSection title="Rewards Navigation">
        <nav className="space-y-0.5">
          <SidebarNavItem 
            href="/rewards-and-points" 
            label="Rewards Overview" 
            icon={<svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>}
          />
          <SidebarNavItem 
            href="/rewards-and-points/tiers" 
            label="Tiers & Multipliers" 
            icon={<svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
            active={true}
          />
        </nav>
      </SidebarSection>
      <div className="relative mb-4">
        <div className="k-search-container h-10">
          <svg
            className="k-search-icon"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search rewards..."
            className={`k-search-input h-10 w-full pl-10 ${searchQuery.length > 0 ? 'is-typing' : ''}`.trim()}
          />
        </div>
      </div>
      <SidebarSection title="Reward Types">
        <nav className="space-y-1">
          {REWARD_SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => scrollToSection(section.id)}
              className="k-sidebar-item w-full text-left"
            >
              <span className="truncate">{section.label}</span>
            </button>
          ))}
        </nav>
      </SidebarSection>
    </UnifiedSidebar>
  );
}
