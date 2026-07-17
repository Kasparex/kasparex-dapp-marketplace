'use client';

import { useDAppDetailNavOptional } from '@/lib/dapps/DAppDetailNavContext';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';

/**
 * Left-sidebar tab switcher for the current dApp (replaces Rewards Status).
 */
export function DAppSidebarTabNav() {
  const nav = useDAppDetailNavOptional();
  if (!nav || nav.tabs.length === 0) return null;

  return (
    <div className="space-y-3">
      <DAppSectionHeader title="Navigate" className="!mb-0" />
      <nav className="flex flex-col gap-1.5" aria-label="dApp sections">
        {nav.tabs.map((tab) => {
          const active = nav.currentTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => nav.setTab(tab.id)}
              className={`flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                active
                  ? 'border-[#02abb8] bg-[#02abb8]/10 text-[#02abb8]'
                  : 'border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/80'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              {tab.icon ? (
                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center [&_svg]:h-4 [&_svg]:w-4">
                  {tab.icon}
                </span>
              ) : null}
              <span className="min-w-0 flex-1 truncate">{tab.label}</span>
              {tab.rightAdornment ? (
                <span className="shrink-0">{tab.rightAdornment}</span>
              ) : null}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
