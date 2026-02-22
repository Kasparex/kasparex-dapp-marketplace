'use client';

import { RevenueTreeContentType } from '@/lib/revenue-tree/types';

interface RevenueTreeTabsProps {
  activeTab: RevenueTreeContentType | 'all';
  onTabChange: (tab: RevenueTreeContentType | 'all') => void;
}

export function RevenueTreeTabs({ activeTab, onTabChange }: RevenueTreeTabsProps) {
  const tabs: Array<{ id: RevenueTreeContentType | 'all'; label: string }> = [
    { id: 'all', label: 'All Trees' },
    { id: 'dapp', label: 'dApps' },
    { id: 'vblog', label: 'vBlog' },
    { id: 'game', label: 'Games' },
    { id: 'store', label: 'Store' },
    { id: 'magazine', label: 'Magazines' },
    { id: 'donation', label: 'Donations' },
  ];

  return (
    <div className="border-b border-zinc-200 dark:border-zinc-800 mb-6">
      <nav className="flex space-x-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              px-4 py-3 text-sm font-bold uppercase tracking-wider whitespace-nowrap
              border-b-2 transition-colors
              ${
                activeTab === tab.id
                  ? 'border-[#02abb8] text-[#02abb8]'
                  : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
