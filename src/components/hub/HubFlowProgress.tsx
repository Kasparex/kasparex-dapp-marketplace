'use client';

import { useEffect, useMemo, useState } from 'react';
import { Tooltip } from '@/components/ui/Tooltip';
import {
  resolveHubFlowCurrentIndex,
  subscribeHubFlowStep,
  type HubFlowStep,
} from '@/lib/hub/hubFlowProgress';

export function HubFlowProgress({
  steps,
  currentIndex: currentIndexProp,
  busy = false,
  complete = false,
  activeStepId = null,
  listenToReports = true,
  title = 'Flow progress',
  className = '',
}: {
  steps: HubFlowStep[];
  /** When set, overrides busy / complete / live report resolution. */
  currentIndex?: number;
  busy?: boolean;
  complete?: boolean;
  activeStepId?: string | null;
  /** Subscribe to reportHubFlowStep() from async clients. */
  listenToReports?: boolean;
  title?: string;
  className?: string;
}) {
  const [liveStepId, setLiveStepId] = useState<string | null>(null);

  useEffect(() => {
    if (!listenToReports) return;
    return subscribeHubFlowStep((detail) => {
      setLiveStepId(detail.stepId);
    });
  }, [listenToReports]);

  useEffect(() => {
    if (!busy && !complete) setLiveStepId(null);
  }, [busy, complete]);

  const currentIndex = useMemo(() => {
    if (typeof currentIndexProp === 'number') return currentIndexProp;
    return resolveHubFlowCurrentIndex({
      steps,
      busy,
      complete,
      activeStepId: activeStepId ?? liveStepId,
    });
  }, [currentIndexProp, steps, busy, complete, activeStepId, liveStepId]);

  if (steps.length === 0) return null;

  const allComplete = currentIndex >= steps.length;

  return (
    <div className={`space-y-2 ${className}`.trim()}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">{title}</p>
        <p className="text-[11px] tabular-nums text-zinc-500 dark:text-zinc-400">
          {allComplete ? steps.length : Math.min(currentIndex + 1, steps.length)} / {steps.length} steps
        </p>
      </div>

      <ol className="flex flex-wrap items-center gap-x-1 gap-y-1.5" aria-label={title}>
        {steps.map((step, index) => {
          const isComplete = allComplete || index < currentIndex;
          const isCurrent = !allComplete && index === currentIndex;
          const isUpcoming = !isComplete && !isCurrent;

          const labelClass = isCurrent
            ? 'text-[color:var(--hub-accent,#02abb8)] font-semibold'
            : isComplete
              ? 'text-zinc-700 dark:text-zinc-200'
              : 'text-zinc-400 dark:text-zinc-500';

          const chipClass = isCurrent
            ? 'border-[color:var(--hub-accent-border,rgba(2,171,184,0.45))] bg-[color:var(--hub-accent-muted,rgba(2,171,184,0.12))]'
            : isComplete
              ? 'border-zinc-300 bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800/60'
              : 'border-transparent bg-transparent';

          return (
            <li key={step.id} className="inline-flex items-center gap-1">
              <Tooltip content={step.tooltip}>
                <span
                  className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] leading-tight transition-colors ${chipClass} ${labelClass}`}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {step.label}
                </span>
              </Tooltip>
              {index < steps.length - 1 ? (
                <span
                  className={`select-none text-[11px] ${
                    isUpcoming ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-400 dark:text-zinc-500'
                  }`}
                  aria-hidden="true"
                >
                  →
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
