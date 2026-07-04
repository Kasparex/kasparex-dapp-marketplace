'use client';

import { useMemo, useState } from 'react';
import type { TokenRoadmapMilestone } from '@/lib/tokens/modules';

const STATUS_OPTIONS: { value: TokenRoadmapMilestone['status']; label: string }[] = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
];

function emptyMilestone(): TokenRoadmapMilestone {
  return { date: '', title: '', description: '', status: 'upcoming' };
}

type TokenRoadmapEditorProps = {
  milestones: TokenRoadmapMilestone[];
  onChange: (milestones: TokenRoadmapMilestone[]) => void;
  disabled?: boolean;
};

export function TokenRoadmapEditor({ milestones, onChange, disabled }: TokenRoadmapEditorProps) {
  const items = milestones.length > 0 ? milestones : [emptyMilestone()];

  const update = (index: number, patch: Partial<TokenRoadmapMilestone>) => {
    const next = [...items];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  return (
    <div className="space-y-4">
      {items.map((milestone, index) => (
        <div
          key={index}
          className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 dark:border-zinc-700 dark:bg-zinc-800/40 space-y-3"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Milestone {index + 1}</p>
            <button
              type="button"
              disabled={disabled || items.length <= 1}
              onClick={() => onChange(items.filter((_, i) => i !== index))}
              className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-40"
            >
              Remove
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="k-label">Date</label>
              <input
                type="text"
                className="k-input mt-1 w-full"
                placeholder="Q2 2026"
                value={milestone.date}
                disabled={disabled}
                onChange={(e) => update(index, { date: e.target.value })}
              />
            </div>
            <div>
              <label className="k-label">Status</label>
              <select
                className="k-input mt-1 w-full"
                value={milestone.status ?? 'upcoming'}
                disabled={disabled}
                onChange={(e) =>
                  update(index, { status: e.target.value as TokenRoadmapMilestone['status'] })
                }
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="k-label">Title</label>
            <input
              type="text"
              className="k-input mt-1 w-full"
              value={milestone.title}
              disabled={disabled}
              onChange={(e) => update(index, { title: e.target.value })}
            />
          </div>
          <div>
            <label className="k-label">Description</label>
            <textarea
              className="k-input mt-1 w-full min-h-[72px]"
              value={milestone.description}
              disabled={disabled}
              onChange={(e) => update(index, { description: e.target.value })}
            />
          </div>
        </div>
      ))}
      <button
        type="button"
        disabled={disabled || items.length >= 12}
        onClick={() => onChange([...items, emptyMilestone()])}
        className="k-control-btn text-sm"
      >
        Add milestone
      </button>
    </div>
  );
}

export function useRoadmapMilestones(initial: TokenRoadmapMilestone[] = []) {
  const [milestones, setMilestones] = useState<TokenRoadmapMilestone[]>(initial);
  return useMemo(() => ({ milestones, setMilestones }), [milestones]);
}
