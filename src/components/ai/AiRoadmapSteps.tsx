'use client';

import type { AiHubSection } from '@/lib/ai/types';
import { AI_ROADMAP_STEPS } from '@/lib/ai/roadmap';

export function AiRoadmapSteps({ onOpenSection }: { onOpenSection: (section: AiHubSection) => void }) {
  return (
    <div className="mt-12">
      <div className="mb-6">
        <p className="text-sm font-black uppercase tracking-widest text-[#02abb8] mb-2">Roadmap</p>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">Next steps</h2>
        <p className="kx-body">
          Layout previews for upcoming Kasparex AI infrastructure on Kaspa L1.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {AI_ROADMAP_STEPS.map((step) => (
          <button
            key={step.id}
            type="button"
            onClick={() => onOpenSection(step.id)}
            className="group text-left rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 sm:p-6 transition-colors hover:border-[#02abb8]/40 hover:bg-cyan-500/5"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-xs font-black text-cyan-700 dark:text-cyan-300">
                {step.phase}
              </span>
              <span
                className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  step.status === 'layout'
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                    : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                {step.statusLabel}
              </span>
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-2 group-hover:text-[#02abb8] transition-colors">
              {step.title}
            </h3>
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{step.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
