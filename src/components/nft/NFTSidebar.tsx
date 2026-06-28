'use client';

import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { SidebarHeader } from '@/components/sidebar/SidebarHeader';
import { SidebarSection } from '@/components/sidebar/SidebarSection';
import { SidebarNavItem } from '@/components/sidebar/SidebarNavItem';
import { NFTStatusBox } from '@/components/rewards/NFTStatusBox';
import { NFT_LISTING_TABS, type NftListingTab } from '@/lib/nft/listingTabs';

export type TabType = 'checker' | 'traits' | 'builder' | 'my-nfts' | 'collections' | 'stats';

export interface NFTSidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  collectionSlug?: string;
  isListingPage?: boolean;
  listingTab?: NftListingTab;
  onListingTabChange?: (tab: NftListingTab) => void;
}

const sectionIcon = (
  <svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
  </svg>
);

function NFTTabIcon({ id, className = '' }: { id: string; className?: string }) {
  const cn = `w-4 h-4 k-sidebar-icon ${className}`;
  switch (id) {
    case 'collections':
      return (
        <svg className={cn} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
      );
    case 'my-nfts':
      return (
        <svg className={cn} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      );
    case 'checker':
      return (
        <svg className={cn} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      );
    case 'traits':
      return (
        <svg className={cn} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      );
    case 'builder':
      return (
        <svg className={cn} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
    case 'stats':
      return (
        <svg className={cn} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
        </svg>
      );
    default:
      return (
        <svg className={cn} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
  }
}

export function NFTSidebar({
  activeTab,
  onTabChange,
  collectionSlug,
  isListingPage = false,
  listingTab = 'premium',
  onListingTabChange,
}: NFTSidebarProps) {
  const backHref = collectionSlug ? '/nft' : '/hub';
  const backLabel = collectionSlug ? 'Back to NFT Tools' : 'Back to Hub';

  const collectionTabs: Array<{ id: Exclude<TabType, 'collections'>; label: string }> = [
    { id: 'my-nfts', label: 'My NFTs' },
    { id: 'checker', label: 'Rarity Checker' },
    { id: 'traits', label: 'Trait Analysis' },
    { id: 'builder', label: 'PFP Builder' },
    { id: 'stats', label: 'Collection Stats' },
  ];

  const goMyNfts = () => {
    onTabChange('my-nfts');
  };

  return (
    <UnifiedSidebar
      storageKeyPrefix="nft-tools"
      defaultWidth={292}
      header={(onHide) => (
        <SidebarHeader backHref={backHref} backLabel={backLabel} onHide={onHide} className="bg-white dark:bg-zinc-950" />
      )}
      footer={
        <div className="px-4 py-3 border-t border-zinc-200/70 dark:border-zinc-800/70">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-lime-500/15 border border-lime-500/30 text-[10px] font-black text-lime-700 dark:text-lime-300">
              NT
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 truncate">NFT Tools</p>
              <p className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 truncate">Kasparex Hub</p>
            </div>
          </div>
        </div>
      }
    >
      {isListingPage && (
        <>
          <div className="space-y-1 mb-4">
            <button
              type="button"
              onClick={() => onTabChange('collections')}
              className={`k-sidebar-item w-full ${activeTab === 'collections' ? 'k-sidebar-item-active font-bold' : 'text-zinc-600 dark:text-zinc-400'}`}
            >
              <NFTTabIcon id="collections" />
              <span className="text-[11px] font-bold uppercase tracking-wider flex-1 truncate text-left">Collections</span>
            </button>
            <button
              type="button"
              onClick={goMyNfts}
              className={`k-sidebar-item w-full ${activeTab === 'my-nfts' ? 'k-sidebar-item-active font-bold' : 'text-zinc-600 dark:text-zinc-400'}`}
            >
              <NFTTabIcon id="my-nfts" />
              <span className="text-[11px] font-bold uppercase tracking-wider flex-1 truncate text-left">My NFTs</span>
            </button>
          </div>

          <SidebarSection title="Browse">
            <nav className="space-y-0.5">
              {NFT_LISTING_TABS.map((item) => (
                <SidebarNavItem
                  key={item.value}
                  label={item.label}
                  icon={sectionIcon}
                  active={activeTab === 'collections' && listingTab === item.value}
                  onClick={() => {
                    onTabChange('collections');
                    onListingTabChange?.(item.value);
                  }}
                />
              ))}
            </nav>
          </SidebarSection>

          <SidebarSection title="Links">
            <nav className="space-y-0.5">
              <SidebarNavItem
                href="/games/minecore?tab=workers"
                label="NFT slot points"
                icon={
                  <svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                }
              />
            </nav>
          </SidebarSection>
        </>
      )}

      {!isListingPage && collectionSlug && (
        <SidebarSection title="Collection">
          <nav className="space-y-0.5">
            {collectionTabs.map((tab) => (
              <SidebarNavItem
                key={tab.id}
                label={tab.label}
                icon={<NFTTabIcon id={tab.id} />}
                active={activeTab === tab.id}
                onClick={() => onTabChange(tab.id)}
              />
            ))}
          </nav>
        </SidebarSection>
      )}

      <div className="mt-4 pt-4 border-t border-zinc-200/70 dark:border-zinc-800/70">
        <NFTStatusBox layout="compact-cards" premiumCollectionsOnly />
      </div>
    </UnifiedSidebar>
  );
}
