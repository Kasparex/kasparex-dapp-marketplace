'use client';

import { AI_SECTION_PLACEHOLDERS } from '@/lib/ai/sidebarSections';
import type { AiHubSection } from '@/lib/ai/types';

export function AiSectionPlaceholder({ section }: { section: Exclude<AiHubSection, 'agents' | 'marketplace' | 'documentation'> }) {
  const meta = AI_SECTION_PLACEHOLDERS[section];

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-8 sm:p-12 text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      </div>
      <p className="text-sm font-black uppercase tracking-widest text-[#02abb8] mb-2">Layout preview</p>
      <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 mb-4">{meta.title}</h2>
      <p className="kx-body max-w-xl mx-auto leading-relaxed">{meta.description}</p>
      <p className="mt-6 text-xs font-bold uppercase tracking-wider text-zinc-400">Coming in a future release</p>
    </div>
  );
}
