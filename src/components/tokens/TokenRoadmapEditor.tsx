'use client';

import { useMemo, useState } from 'react';
import { KxFormFieldLabel } from '@/components/ui/KxFormFieldLabel';
import { KxRichTextEditor } from '@/components/ui/KxRichTextEditor';
import { KX_FORM_ADD_BTN_CLASS } from '@/components/ui/KxLinkRowsEditor';
import type { TokenRoadmapMilestone } from '@/lib/tokens/modules';
import { contentForRichEditor } from '@/lib/richText/html';

const STATUS_OPTIONS: { value: TokenRoadmapMilestone['status']; label: string }[] = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
];

function emptyMilestone(): TokenRoadmapMilestone {
  return { date: '', title: '', description: '', status: 'upcoming' };
}

type TokenRoadmapEditorProps = {
  intro?: string;
  outro?: string;
  milestones: TokenRoadmapMilestone[];
  onIntroChange?: (intro: string) => void;
  onOutroChange?: (outro: string) => void;
  onChange: (milestones: TokenRoadmapMilestone[]) => void;
  disabled?: boolean;
};

export function TokenRoadmapEditor({
  intro = '',
  outro = '',
  milestones,
  onIntroChange,
  onOutroChange,
  onChange,
  disabled,
}: TokenRoadmapEditorProps) {
  const items = milestones.length > 0 ? milestones : [emptyMilestone()];

  const update = (index: number, patch: Partial<TokenRoadmapMilestone>) => {
    const next = [...items];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  return (
    <div className="space-y-4">
      {onIntroChange ? (
        <div>
          <KxFormFieldLabel>Intro text</KxFormFieldLabel>
          <p className="kx-body-sm mb-2">Optional context shown before the roadmap timeline.</p>
          <KxRichTextEditor
            value={contentForRichEditor(intro)}
            onChange={onIntroChange}
            placeholder="Introduce your roadmap..."
            minRows={4}
            disabled={disabled}
          />
        </div>
      ) : null}

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
              <KxFormFieldLabel>Date</KxFormFieldLabel>
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
              <KxFormFieldLabel>Status</KxFormFieldLabel>
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
            <KxFormFieldLabel>Title</KxFormFieldLabel>
            <input
              type="text"
              className="k-input mt-1 w-full"
              value={milestone.title}
              disabled={disabled}
              onChange={(e) => update(index, { title: e.target.value })}
            />
          </div>
          <div>
            <KxFormFieldLabel>Description</KxFormFieldLabel>
            <KxRichTextEditor
              value={contentForRichEditor(milestone.description)}
              onChange={(description) => update(index, { description })}
              placeholder="Milestone details..."
              minRows={4}
              disabled={disabled}
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        disabled={disabled || items.length >= 12}
        onClick={() => onChange([...items, emptyMilestone()])}
        className={KX_FORM_ADD_BTN_CLASS}
      >
        Add milestone
      </button>

      {onOutroChange ? (
        <div>
          <KxFormFieldLabel>Outro text</KxFormFieldLabel>
          <p className="kx-body-sm mb-2">Optional closing notes shown after the roadmap timeline.</p>
          <KxRichTextEditor
            value={contentForRichEditor(outro)}
            onChange={onOutroChange}
            placeholder="Closing thoughts or next steps..."
            minRows={4}
            disabled={disabled}
          />
        </div>
      ) : null}
    </div>
  );
}

export function useRoadmapMilestones(initial: TokenRoadmapMilestone[] = []) {
  const [milestones, setMilestones] = useState<TokenRoadmapMilestone[]>(initial);
  return useMemo(() => ({ milestones, setMilestones }), [milestones]);
}
