'use client';

import type { KrexWrapRecord, KrexWrapStatus } from '@/lib/krex/wrap/types';
import { KX_SURFACE_NESTED } from '@/lib/hub/shellTokens';
import { Tooltip } from '@/components/ui/Tooltip';

type StepState = 'done' | 'current' | 'upcoming' | 'failed';

type FlowStep = {
  id: string;
  label: string;
  detail: string;
  tip?: string;
  state: StepState;
};

function v2Steps(status: KrexWrapStatus, ticketReady: boolean): FlowStep[] {
  if (status === 'failed') {
    return [
      { id: 'fee', label: 'Fee', detail: 'Bridge fee', state: 'done' },
      { id: 'burn', label: 'Burn', detail: 'Stopped or rejected', state: 'failed' },
      { id: 'attest', label: 'Confirm', detail: 'Not started', state: 'upcoming' },
      { id: 'mint', label: 'Claim', detail: 'KCC20 not issued', state: 'upcoming' },
    ];
  }

  const normalized: KrexWrapStatus =
    status === 'pending_mint' ? 'awaiting_attest' : status === 'deposited' ? 'burned' : status;

  // Stay on Confirm until the claim ticket exists. Do not jump to Claim early.
  let currentIdx = 1;
  if (normalized === 'minted') currentIdx = 4;
  else if (normalized === 'fee_paid') currentIdx = 1;
  else if (normalized === 'burned') currentIdx = 2;
  else if (normalized === 'awaiting_attest') currentIdx = ticketReady ? 3 : 2;

  const labels: Array<{
    id: string;
    label: string;
    doneDetail: string;
    currentDetail: string;
    nextDetail: string;
    tip: string;
  }> = [
    {
      id: 'fee',
      label: 'Fee',
      doneDetail: 'KAS fee paid',
      currentDetail: 'Confirm fee in wallet',
      nextDetail: 'Pay bridge fee',
      tip: 'Small KAS fee to Hub treasury before the burn.',
    },
    {
      id: 'burn',
      label: 'Burn',
      doneDetail: 'KRC-20 sent to sink',
      currentDetail: 'Confirm burn in wallet',
      nextDetail: 'Burn to sink',
      tip: 'Tokens go to an address with no private key. This cannot be undone.',
    },
    {
      id: 'attest',
      label: 'Confirm',
      doneDetail: 'Burn confirmed',
      currentDetail: ticketReady
        ? 'Ticket ready'
        : 'Please wait… claim ticket (may take a few minutes)',
      nextDetail: 'Attestors confirm burn',
      tip: 'Kasplex opAccept, then a one-time claim ticket. Often under 2 minutes; can take a few.',
    },
    {
      id: 'mint',
      label: 'Claim',
      doneDetail: 'KCC20 received 1:1',
      currentDetail: 'Sign Claim in KasWare',
      nextDetail: 'Claim matching KCC20',
      tip: 'You sign the claim. KCC20 is a covenant coin on Kaspa L1 (see kascov).',
    },
  ];

  return labels.map((step, i) => {
    if (normalized === 'minted' || i < currentIdx) {
      return {
        id: step.id,
        label: step.label,
        detail: step.doneDetail,
        tip: step.tip,
        state: 'done' as const,
      };
    }
    if (i === currentIdx) {
      return {
        id: step.id,
        label: step.label,
        detail: step.currentDetail,
        tip: step.tip,
        state: 'current' as const,
      };
    }
    return {
      id: step.id,
      label: step.label,
      detail: step.nextDetail,
      tip: step.tip,
      state: 'upcoming' as const,
    };
  });
}

function v1Steps(status: KrexWrapStatus): FlowStep[] {
  if (status === 'failed') {
    return [
      { id: 'fee', label: 'Fee', detail: 'Bridge fee', state: 'done' },
      { id: 'deposit', label: 'Deposit', detail: 'Stopped or rejected', state: 'failed' },
      { id: 'mint', label: 'Mint', detail: 'KCC20 not issued', state: 'upcoming' },
    ];
  }
  const currentIdx =
    status === 'minted' ? 3 : status === 'fee_paid' ? 1 : status === 'pending_mint' || status === 'deposited' ? 2 : 1;
  const labels = [
    { id: 'fee', label: 'Fee', done: 'KAS fee paid', cur: 'Confirm fee in wallet', next: 'Pay bridge fee' },
    {
      id: 'deposit',
      label: 'Deposit',
      done: 'KRC-20 in vault',
      cur: 'Confirm deposit in wallet',
      next: 'Send to vault',
    },
    {
      id: 'mint',
      label: 'Mint',
      done: 'KCC20 minted 1:1',
      cur: 'Please wait… mint pending',
      next: 'Matching KCC20 mint',
    },
  ];
  return labels.map((step, i) => {
    if (status === 'minted' || i < currentIdx) {
      return { id: step.id, label: step.label, detail: step.done, state: 'done' as const };
    }
    if (i === currentIdx) {
      return { id: step.id, label: step.label, detail: step.cur, state: 'current' as const };
    }
    return { id: step.id, label: step.label, detail: step.next, state: 'upcoming' as const };
  });
}

function nextHint(steps: FlowStep[], migrateV2: boolean, ticketReady: boolean): string {
  const current = steps.find((s) => s.state === 'current');
  const failed = steps.find((s) => s.state === 'failed');
  if (failed) return 'This migration did not complete. Start a new one from Migrate.';
  if (!current) {
    return migrateV2
      ? 'Done. Your KCC20 is on Kaspa L1. Open Claim tx or kascov.'
      : 'Done. Your KCC20 is on Kaspa L1.';
  }
  if (current.id === 'attest') {
    return ticketReady
      ? 'Ticket ready. Tap Claim KCC20 and sign in KasWare.'
      : 'Confirming burn and issuing your claim ticket. Usually under 2 minutes. History refreshes automatically.';
  }
  if (current.id === 'mint') {
    return 'Tap Claim KCC20, then sign in KasWare.';
  }
  return `Next: ${current.detail}.`;
}

function StepIcon({ state }: { state: StepState }) {
  if (state === 'done') {
    return (
      <span
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white"
        aria-hidden
      >
        ✓
      </span>
    );
  }
  if (state === 'current') {
    return (
      <span
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center"
        role="status"
        aria-label="In progress"
      >
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-[color:var(--hub-accent)] border-t-transparent"
          aria-hidden
        />
      </span>
    );
  }
  if (state === 'failed') {
    return (
      <span
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white"
        aria-hidden
      >
        ×
      </span>
    );
  }
  return (
    <span
      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-zinc-300 dark:border-zinc-600"
      aria-hidden
    />
  );
}

/**
 * Compact Fee → Burn → Confirm → Claim rail for History rows.
 */
export function KrexWrapMigrateProgress({
  row,
  migrateV2,
  ticketReady = false,
}: {
  row: KrexWrapRecord;
  migrateV2: boolean;
  /** True when MigrateTicket is on the Hub attestation and Claim can be signed. */
  ticketReady?: boolean;
}) {
  const useV2 = migrateV2 || row.migrateVersion === 2 || row.status === 'burned' || row.status === 'awaiting_attest';
  const steps = useV2 ? v2Steps(row.status, ticketReady) : v1Steps(row.status);
  const hint = nextHint(steps, useV2, ticketReady);

  return (
    <div className={`${KX_SURFACE_NESTED} p-3.5`} aria-label="Migration progress">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Progress
        </p>
        <p className="text-[11px] tabular-nums text-zinc-500 dark:text-zinc-400">
          {steps.filter((s) => s.state === 'done').length}/{steps.length}
        </p>
      </div>
      <ol className="divide-y divide-zinc-200/80 dark:divide-zinc-700/80">
        {steps.map((step) => (
          <li key={step.id} className="flex items-start gap-2.5 py-2.5 first:pt-0 last:pb-0">
            <StepIcon state={step.state} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                {step.tip ? (
                  <Tooltip content={step.tip}>
                    <span
                      className={`cursor-help text-xs font-semibold underline decoration-dotted underline-offset-2 ${
                        step.state === 'upcoming'
                          ? 'text-zinc-500 dark:text-zinc-400'
                          : 'text-zinc-900 dark:text-zinc-100'
                      }`}
                    >
                      {step.label}
                    </span>
                  </Tooltip>
                ) : (
                  <span
                    className={`text-xs font-semibold ${
                      step.state === 'upcoming'
                        ? 'text-zinc-500 dark:text-zinc-400'
                        : 'text-zinc-900 dark:text-zinc-100'
                    }`}
                  >
                    {step.label}
                  </span>
                )}
                <span
                  className={`shrink-0 text-[10px] uppercase tracking-wide ${
                    step.state === 'current'
                      ? 'font-semibold text-[color:var(--hub-accent)]'
                      : 'text-zinc-500 dark:text-zinc-400'
                  }`}
                >
                  {step.state === 'done'
                    ? 'Done'
                    : step.state === 'failed'
                      ? 'Failed'
                      : step.state === 'current'
                        ? step.id === 'attest'
                          ? 'Please wait'
                          : step.id === 'mint'
                            ? 'Sign'
                            : 'Confirm'
                        : 'Next'}
                </span>
              </div>
              <p
                className={`mt-0.5 text-[11px] leading-snug ${
                  step.state === 'current'
                    ? 'text-zinc-700 dark:text-zinc-300'
                    : 'text-zinc-500 dark:text-zinc-400'
                }`}
              >
                {step.detail}
              </p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-3 border-t border-zinc-200/80 pt-3 text-[11px] leading-snug text-zinc-600 dark:border-zinc-700/80 dark:text-zinc-400">
        {hint}
      </p>
    </div>
  );
}
