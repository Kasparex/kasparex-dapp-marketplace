'use client';

import type { ReactNode } from 'react';
import type { KrexWrapRecord, KrexWrapStatus } from '@/lib/krex/wrap/types';
import { KX_SURFACE_NESTED } from '@/lib/hub/shellTokens';
import { Tooltip } from '@/components/ui/Tooltip';
import { KxCopyIconButton } from '@/components/ui/KxCopyIconButton';
import { extractTxId, getExplorerTxUrl } from '@/lib/store/utils';

type StepState = 'done' | 'current' | 'upcoming' | 'failed';

type FlowStep = {
  id: string;
  label: string;
  detail: string;
  tip?: string;
  state: StepState;
  txHash?: string;
  txKind?: 'fee' | 'burn' | 'deposit' | 'claim';
};

function shortTxId(txHash: string | undefined | null): string {
  const id = extractTxId(txHash || '') || String(txHash || '').trim();
  if (!id) return 'tx';
  if (id.length <= 16) return id;
  return `${id.slice(0, 8)}…${id.slice(-6)}`;
}

function ExternalTabIcon({ className = 'h-3 w-3' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
      />
    </svg>
  );
}

const STEP_TX_CHIP =
  'inline-flex max-w-full items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-800 ring-1 ring-zinc-200 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-zinc-600 dark:hover:bg-zinc-700';

function v2Steps(
  status: KrexWrapStatus,
  ticketReady: boolean,
  row: KrexWrapRecord,
): FlowStep[] {
  if (status === 'failed') {
    return [
      {
        id: 'fee',
        label: 'Fee',
        detail: 'Bridge fee',
        state: 'done',
        txHash: row.feeTxHash,
        txKind: 'fee',
      },
      { id: 'burn', label: 'Burn', detail: 'Stopped or rejected', state: 'failed' },
      { id: 'attest', label: 'Confirm', detail: 'Not started', state: 'upcoming' },
      { id: 'mint', label: 'Claim', detail: 'KCC20 not issued', state: 'upcoming' },
    ];
  }

  const normalized: KrexWrapStatus =
    status === 'pending_mint' ? 'awaiting_attest' : status === 'deposited' ? 'burned' : status;

  let currentIdx = 1;
  if (normalized === 'minted') currentIdx = 4;
  else if (normalized === 'fee_paid') currentIdx = 1;
  else if (normalized === 'burned' || normalized === 'awaiting_attest') {
    currentIdx = ticketReady ? 3 : 2;
  }

  const labels: Array<{
    id: string;
    label: string;
    doneDetail: string;
    currentDetail: string;
    nextDetail: string;
    tip: string;
    txHash?: string;
    txKind?: FlowStep['txKind'];
  }> = [
    {
      id: 'fee',
      label: 'Fee',
      doneDetail: 'KAS fee paid',
      currentDetail: 'Confirm fee in wallet',
      nextDetail: 'Pay bridge fee',
      tip: 'Small KAS fee to Hub treasury before the burn.',
      txHash: row.feeTxHash,
      txKind: 'fee',
    },
    {
      id: 'burn',
      label: 'Burn',
      doneDetail: 'KRC-20 sent to sink',
      currentDetail: 'Confirm burn in wallet',
      nextDetail: 'Burn to sink',
      tip: 'Tokens go to an address with no private key. This cannot be undone.',
      txHash: row.depositTxHash,
      txKind: 'burn',
    },
    {
      id: 'attest',
      label: 'Confirm',
      doneDetail: 'Burn confirmed',
      currentDetail: ticketReady
        ? 'Ticket ready'
        : 'Please wait… claim ticket (usually under 2 minutes)',
      nextDetail: 'Attestors confirm burn',
      tip: 'Kasplex opAccept, then a one-time claim ticket. Usually under 2 minutes.',
    },
    {
      id: 'mint',
      label: 'Claim',
      doneDetail: 'KCC20 received 1:1',
      currentDetail: ticketReady ? 'Sign Claim in KasWare' : 'Waiting for ticket…',
      nextDetail: 'Claim matching KCC20',
      tip: 'You sign the claim. KCC20 is a covenant coin on Kaspa L1 (see kascov).',
      txHash: row.mintTxHash,
      txKind: 'claim',
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
        txHash: step.txHash,
        txKind: step.txKind,
      };
    }
    if (i === currentIdx) {
      return {
        id: step.id,
        label: step.label,
        detail: step.currentDetail,
        tip: step.tip,
        state: 'current' as const,
        txHash: step.txHash,
        txKind: step.txKind,
      };
    }
    return {
      id: step.id,
      label: step.label,
      detail: step.nextDetail,
      tip: step.tip,
      state: 'upcoming' as const,
      txHash: step.id === 'mint' ? step.txHash : undefined,
      txKind: step.id === 'mint' ? step.txKind : undefined,
    };
  });
}

function v1Steps(status: KrexWrapStatus, row: KrexWrapRecord): FlowStep[] {
  if (status === 'failed') {
    return [
      {
        id: 'fee',
        label: 'Fee',
        detail: 'Bridge fee',
        state: 'done',
        txHash: row.feeTxHash,
        txKind: 'fee',
      },
      { id: 'deposit', label: 'Deposit', detail: 'Stopped or rejected', state: 'failed' },
      { id: 'mint', label: 'Mint', detail: 'KCC20 not issued', state: 'upcoming' },
    ];
  }
  const currentIdx =
    status === 'minted' ? 3 : status === 'fee_paid' ? 1 : status === 'pending_mint' || status === 'deposited' ? 2 : 1;
  const labels: Array<{
    id: string;
    label: string;
    done: string;
    cur: string;
    next: string;
    txHash?: string;
    txKind?: FlowStep['txKind'];
  }> = [
    {
      id: 'fee',
      label: 'Fee',
      done: 'KAS fee paid',
      cur: 'Confirm fee in wallet',
      next: 'Pay bridge fee',
      txHash: row.feeTxHash,
      txKind: 'fee',
    },
    {
      id: 'deposit',
      label: 'Deposit',
      done: 'KRC-20 in vault',
      cur: 'Confirm deposit in wallet',
      next: 'Send to vault',
      txHash: row.depositTxHash,
      txKind: 'deposit',
    },
    {
      id: 'mint',
      label: 'Mint',
      done: 'KCC20 minted 1:1',
      cur: 'Please wait… mint pending',
      next: 'Matching KCC20 mint',
      txHash: row.mintTxHash,
      txKind: 'claim',
    },
  ];
  return labels.map((step, i) => {
    if (status === 'minted' || i < currentIdx) {
      return {
        id: step.id,
        label: step.label,
        detail: step.done,
        state: 'done' as const,
        txHash: step.txHash,
        txKind: step.txKind,
      };
    }
    if (i === currentIdx) {
      return {
        id: step.id,
        label: step.label,
        detail: step.cur,
        state: 'current' as const,
        txHash: step.txHash,
        txKind: step.txKind,
      };
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
      ? 'Done. KCC20 is on Kaspa L1 as a kascov coin (not listed in KasWare).'
      : 'Done. Your KCC20 is on Kaspa L1.';
  }
  if (current.id === 'attest') {
    return ticketReady
      ? 'Ticket ready. Tap Claim KCC20 and sign in KasWare.'
      : 'Confirming burn and issuing your claim ticket automatically. Usually under 2 minutes. No action needed until Claim.';
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

function StepTxCapsule({
  txHash,
  kind,
  network,
}: {
  txHash: string;
  kind: NonNullable<FlowStep['txKind']>;
  network: 'mainnet' | 'testnet-10';
}) {
  const id = extractTxId(txHash);
  if (!id) return null;
  const label =
    kind === 'fee' ? 'Fee' : kind === 'burn' ? 'Burn' : kind === 'deposit' ? 'Deposit' : 'Claim';
  return (
    <span className="inline-flex max-w-full items-center gap-0.5">
      <a
        className={STEP_TX_CHIP}
        href={getExplorerTxUrl(id, network)}
        target="_blank"
        rel="noreferrer"
        title={id}
      >
        {label} {shortTxId(id)}
        <ExternalTabIcon />
      </a>
      <KxCopyIconButton value={id} label={`Copy ${label} transaction id`} className="!p-0.5" />
    </span>
  );
}

/**
 * Compact Fee → Burn → Confirm → Claim rail for History rows.
 */
export function KrexWrapMigrateProgress({
  row,
  migrateV2,
  ticketReady = false,
  claimAction,
}: {
  row: KrexWrapRecord;
  migrateV2: boolean;
  /** True when MigrateTicket is on the Hub attestation and Claim can be signed. */
  ticketReady?: boolean;
  /** Claim / Waiting button rendered on the right of the Claim capsule (same slot as Claim tx). */
  claimAction?: ReactNode;
}) {
  const useV2 = migrateV2 || row.migrateVersion === 2 || row.status === 'burned' || row.status === 'awaiting_attest';
  const steps = useV2 ? v2Steps(row.status, ticketReady, row) : v1Steps(row.status, row);
  const hint = nextHint(steps, useV2, ticketReady);
  const net = row.network === 'testnet-10' ? 'testnet-10' : 'mainnet';
  const showClaimAction =
    Boolean(claimAction) &&
    !row.mintTxHash &&
    (row.status === 'burned' || row.status === 'awaiting_attest' || row.status === 'pending_mint');

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
        {steps.map((step) => {
          const txId = step.txHash ? extractTxId(step.txHash) : '';
          const isClaimStep = step.id === 'mint';
          const showTx =
            Boolean(txId) &&
            (step.state === 'done' || (step.state === 'current' && step.txKind && !isClaimStep));
          const showClaimTx = isClaimStep && step.state === 'done' && Boolean(txId);
          const showClaimBtn = isClaimStep && showClaimAction && step.state !== 'done';
          return (
            <li key={step.id} className="flex items-start gap-2.5 py-2.5 first:pt-0 last:pb-0">
              <StepIcon state={step.state} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
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
                  {(showTx || showClaimTx) && step.txHash && step.txKind ? (
                    <StepTxCapsule txHash={step.txHash} kind={step.txKind} network={net} />
                  ) : showClaimBtn ? (
                    <div className="shrink-0">{claimAction}</div>
                  ) : (
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
                  )}
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
          );
        })}
      </ol>
      <p className="mt-3 border-t border-zinc-200/80 pt-3 text-[11px] leading-snug text-zinc-600 dark:border-zinc-700/80 dark:text-zinc-400">
        {hint}
      </p>
    </div>
  );
}
