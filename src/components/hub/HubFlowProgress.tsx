'use client';

import { useEffect, useMemo, useState } from 'react';
import { Tooltip } from '@/components/ui/Tooltip';
import {
  resolveHubFlowCurrentIndex,
  subscribeHubFlowStep,
  type HubFlowStep,
} from '@/lib/hub/hubFlowProgress';

const SETTLE_STATUS =
  'Waiting for fee confirmation. The next wallet prompt may take a few moments.';

export function HubFlowProgress({
  steps,
  currentIndex: currentIndexProp,
  busy = false,
  complete = false,
  activeStepId = null,
  listenToReports = true,
  statusMessage: statusMessageProp,
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
  /** Optional status line under the step strip. */
  statusMessage?: string | null;
  className?: string;
}) {
  const [liveStepId, setLiveStepId] = useState<string | null>(null);
  const [liveMessage, setLiveMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!listenToReports) return;
    return subscribeHubFlowStep((detail) => {
      setLiveStepId(detail.stepId);
      setLiveMessage(detail.message?.trim() || null);
    });
  }, [listenToReports]);

  useEffect(() => {
    if (!busy && !complete) {
      setLiveStepId(null);
      setLiveMessage(null);
    }
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
  const activeId = activeStepId ?? liveStepId;
  const statusMessage =
    statusMessageProp ??
    liveMessage ??
    (busy && activeId === 'settle' ? SETTLE_STATUS : null);

  return (
    <div className={`w-full space-y-2 ${className}`.trim()}>
      <ol className="flex w-full items-center gap-0.5" aria-label="Transaction flow">
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
                  className={`inline-flex w-full min-w-0 items-center justify-center rounded-xl border px-1.5 py-1.5 text-center text-[10px] leading-tight transition-colors sm:text-[11px] ${chipClass} ${labelClass}`}
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

      {statusMessage ? (
        <p
          className="flex items-start gap-2 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400"
          role="status"
          aria-live="polite"
        >
          <span
            className="mt-0.5 inline-block h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-zinc-300 border-t-[color:var(--hub-accent,#02abb8)] dark:border-zinc-600 dark:border-t-[color:var(--hub-accent,#02abb8)]"
            aria-hidden="true"
          />
          <span>{statusMessage}</span>
        </p>
      ) : null}
    </div>
  );
}
