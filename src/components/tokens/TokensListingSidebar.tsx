'use client';

import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { SidebarSection } from '@/components/sidebar/SidebarSection';
import { SidebarQuickActions } from '@/components/sidebar/SidebarQuickActions';

interface TokensListingSidebarProps {
  // Can add filter props here if needed
}

function TokenLinkIcon({ id, className = '' }: { id: string; className?: string }) {
  const iconProps = { className: `k-sidebar-icon ${className}`, strokeWidth: 2, fill: 'none' as const, viewBox: '0 0 24 24', stroke: 'currentColor' as const };
  switch (id) {
    case 'hub': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
    case 'dapps': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
    case 'rewards': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2v-2m0 13V5.5A2.5 2.5 0 1019.5 8V19M12 8l-4-4m4 4l4-4" /></svg>;
    default: return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
  }
}

const QUICK_LINKS = [
  { id: 'hub', label: 'Back to Hub', href: '/hub', icon: <TokenLinkIcon id="hub" /> },
  { id: 'dapps', label: 'Explore dApps', href: '/dapps', icon: <TokenLinkIcon id="dapps" /> },
  { id: 'rewards', label: 'View Rewards', href: '/points', icon: <TokenLinkIcon id="rewards" /> },
];

export function TokensListingSidebar(_props: TokensListingSidebarProps) {
  const header = (onHide: () => void) => (
    <div className="flex-shrink-0 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Kasparex Tokens</h2>
        <button
          type="button"
          onClick={onHide}
          className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded transition-colors"
          aria-label="Hide sidebar"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>
    </div>
  );

  return (
    <UnifiedSidebar storageKeyPrefix="tokens-listing" header={header}>
      <div className="p-4 space-y-6">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">About Kasparex Tokens</h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Explore all tokens in the Kasparex ecosystem, including global tokens like KREX and GRID, and collaboration tokens.
          </p>
        </div>
        <SidebarQuickActions title="Quick Links" items={QUICK_LINKS} />
        <SidebarSection title="Token Types">
          <div className="space-y-2 text-xs px-1">
            <div>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">Global:</span>
              <span className="text-zinc-600 dark:text-zinc-400 ml-1">Ecosystem-wide tokens (KREX, GRID)</span>
            </div>
            <div>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">GRID:</span>
              <span className="text-zinc-600 dark:text-zinc-400 ml-1">Global reward token earned across all dApps</span>
            </div>
            <div>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">Collab:</span>
              <span className="text-zinc-600 dark:text-zinc-400 ml-1">Collaboration tokens</span>
            </div>
          </div>
        </SidebarSection>
      </div>
    </UnifiedSidebar>
  );
}
