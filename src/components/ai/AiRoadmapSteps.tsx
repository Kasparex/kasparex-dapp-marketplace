'use client';

import type { AiHubSection } from '@/lib/ai/types';
import { AI_ROADMAP_STEPS } from '@/lib/ai/roadmap';

export function AiRoadmapSteps({ onOpenSection }: { onOpenSection: (section: AiHubSection) => void }) {
  return (
    <div className="mt-12">
      <div className="mb-6">
        <p className="mb-2 text-sm font-black uppercase tracking-widest text-[color:var(--hub-accent)]">Roadmap</p>
        <h2 className="mb-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">Next steps</h2>
        <p className="kx-body">Layout previews for upcoming Kasparex AI infrastructure on Kaspa L1.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {AI_ROADMAP_STEPS.map((step) => (
          <button
            key={step.id}
            type="button"
            onClick={() => onOpenSection(step.id)}
            className="group rounded-2xl border border-zinc-200 bg-white p-5 text-left transition-colors hover:border-[color:var(--hub-accent-border)] hover:bg-[color:var(--hub-accent-muted)] dark:border-zinc-800 dark:bg-zinc-950 sm:p-6"
          >
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[color:var(--hub-accent-muted)] text-xs font-black text-[color:var(--hub-accent)]">
                {step.phase}
              </span>
              <span
                className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  step.status === 'layout'
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                    : 'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                }`}
              >
                {step.statusLabel}
              </span>
            </div>
            <h3 className="mb-2 text-base font-bold text-zinc-900 transition-colors group-hover:text-[color:var(--hub-accent)] dark:text-zinc-100">
              {step.title}
            </h3>
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{step.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
