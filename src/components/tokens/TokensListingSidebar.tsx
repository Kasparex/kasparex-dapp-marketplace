'use client';

import type { TokenNetwork, TokenType } from '@/lib/tokens/types';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { SidebarHeader } from '@/components/sidebar/SidebarHeader';
import { SidebarSection } from '@/components/sidebar/SidebarSection';
import { SidebarQuickActions } from '@/components/sidebar/SidebarQuickActions';
import { SidebarNavItem } from '@/components/sidebar/SidebarNavItem';

interface TokensListingSidebarProps {
  typeFilter?: TokenType | 'all';
  networkFilter?: TokenNetwork | 'all';
  onTypeChange?: (type: TokenType | 'all') => void;
  onNetworkChange?: (network: TokenNetwork | 'all') => void;
}

function TokenLinkIcon({ id, className = '' }: { id: string; className?: string }) {
  const iconProps = { className: `k-sidebar-icon ${className}`, strokeWidth: 2, fill: 'none' as const, viewBox: '0 0 24 24', stroke: 'currentColor' as const };
  switch (id) {
    case 'hub': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
    case 'dapps': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
    case 'rewards': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    default: return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
  }
}

const QUICK_LINKS = [
  { id: 'hub', label: 'Back to Hub', href: '/hub', icon: <TokenLinkIcon id="hub" /> },
  { id: 'dapps', label: 'Explore dApps', href: '/', icon: <TokenLinkIcon id="dapps" /> },
  { id: 'rewards', label: 'View Rewards', href: '/points', icon: <TokenLinkIcon id="rewards" /> },
];

const typeIcon = <svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>;
const networkIcon = <svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" /></svg>;

export function TokensListingSidebar({
  typeFilter = 'all',
  networkFilter = 'all',
  onTypeChange,
  onNetworkChange,
}: TokensListingSidebarProps) {
  const tokensFooter = (
    <div className="flex items-center gap-3 p-4 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800">
      <div className="w-8 h-8 rounded-xl bg-[#02abb8]/10 text-[#02abb8] flex items-center justify-center font-black text-[10px]">KT</div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-widest truncate">Kasparex Tokens</p>
        <p className="text-[9px] font-bold text-zinc-500 uppercase">Ecosystem</p>
      </div>
    </div>
  );

  return (
    <UnifiedSidebar
      storageKeyPrefix="tokens-listing"
      header={(onHide) => (
        <SidebarHeader
          backHref="/hub"
          backLabel="Back to Hub"
          onHide={onHide}
          className="bg-white dark:bg-zinc-950"
        />
      )}
      footer={tokensFooter}
    >
      <SidebarQuickActions title="Quick Links" items={QUICK_LINKS} />

      <SidebarSection title="Filter">
        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 px-1">Type</p>
            <nav className="space-y-0.5">
              {(['all', 'global', 'local', 'collab'] as const).map((type) => (
                <SidebarNavItem
                  key={type}
                  label={type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                  icon={typeIcon}
                  active={typeFilter === type}
                  onClick={onTypeChange ? () => onTypeChange(type) : undefined}
                />
              ))}
            </nav>
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 px-1">Network</p>
            <nav className="space-y-0.5">
              {(['all', 'L1', 'L2'] as const).map((network) => (
                <SidebarNavItem
                  key={network}
                  label={network === 'all' ? 'All Networks' : network}
                  icon={networkIcon}
                  active={networkFilter === network}
                  onClick={onNetworkChange ? () => onNetworkChange(network) : undefined}
                />
              ))}
            </nav>
          </div>
        </div>
      </SidebarSection>
    </UnifiedSidebar>
  );
}
