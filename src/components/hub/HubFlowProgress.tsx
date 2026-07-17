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
    <ol
      className={`flex w-full items-center gap-0.5 ${className}`.trim()}
      aria-label="Transaction flow"
    >
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
            : 'border-zinc-200/80 bg-zinc-50/50 dark:border-zinc-700/80 dark:bg-zinc-900/40';

        return (
          <li key={step.id} className="flex min-w-0 flex-1 items-center gap-0.5">
            <Tooltip content={step.tooltip}>
              <span
                className={`inline-flex w-full min-w-0 items-center justify-center rounded-md border px-1 py-1.5 text-center text-[10px] leading-tight transition-colors sm:text-[11px] ${chipClass} ${labelClass}`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                <span className="truncate">{step.label}</span>
              </span>
            </Tooltip>
            {index < steps.length - 1 ? (
              <span
                className={`shrink-0 select-none text-[10px] sm:text-[11px] ${
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
  );
}
