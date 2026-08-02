'use client';

import type { ReactNode } from 'react';
import { GamePanelCard } from '@/components/games/layout/GamePanelCard';
import { Tooltip } from '@/components/ui/Tooltip';
import { gameTooltipRich } from '@/components/games/gameTooltipRich';

function formatDuration(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

/**
 * Shared Games paid-window timer (Precision Click Lock window chrome).
 * Tooltip wraps the whole card (no ? icon). No nested inset wrapper.
 */
export function GameLockWindowPanel(props: {
  title?: string;
  /** Shown as the remaining countdown (or Locked). */
  msLeft: number;
  active: boolean;
  /** Fill percent 0–100 for the accent progress bar. */
  pct: number;
  /** Right-side note, e.g. "Base 24h · extend via Chrono Seals…". */
  baseNote: string;
  tooltipTitle: string;
  tooltipDescription: string;
  /** Optional footer under the bar. */
  footer?: ReactNode;
}) {
  const title = props.title ?? 'Lock window';
  return (
    <Tooltip content={gameTooltipRich(props.tooltipTitle, props.tooltipDescription)}>
      <div>
        <GamePanelCard title={title}>
          <div className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Time remaining</p>
                <p className="text-xl font-black tabular-nums text-zinc-900 dark:text-zinc-100">
                  {props.active ? formatDuration(props.msLeft) : 'Locked'}
                </p>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{props.baseNote}</p>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div
                className="h-full rounded-full bg-[color:var(--hub-accent)] transition-[width] duration-500"
                style={{ width: `${props.active ? Math.max(0, Math.min(100, props.pct)) : 0}%` }}
              />
            </div>
            {props.footer}
          </div>
        </GamePanelCard>
      </div>
    </Tooltip>
  );
}
