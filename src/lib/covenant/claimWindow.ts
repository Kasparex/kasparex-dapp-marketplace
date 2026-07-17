/**
 * Timelock claim-window helpers: unlock → claim period → deadline (creator reclaim).
 */

export type ClaimWindowPhase = 'locking' | 'claimable' | 'expired' | 'done';

export type ClaimWindowProgress = {
  phase: ClaimWindowPhase;
  /** 0–100 fill for the active bar segment. */
  percent: number;
  label: string;
  detail: string;
};

function formatRemaining(ms: number): string {
  const remainingMin = Math.ceil(ms / 60_000);
  if (remainingMin < 60) return `${Math.max(1, remainingMin)} min left`;
  if (remainingMin < 60 * 48) return `${Math.ceil(remainingMin / 60)} h left`;
  return `${Math.ceil(remainingMin / (60 * 24))} d left`;
}

/** Default reclaim deadline: 7 days after unlock. */
export function defaultDeadlineAfterUnlock(unlockAtMs: number): number {
  return unlockAtMs + 7 * 86_400_000;
}

export function resolveClaimWindowProgress(args: {
  now: number;
  createdAt?: number | null;
  unlockAt: number | null | undefined;
  deadlineAt: number | null | undefined;
  done?: boolean;
  doneLabel?: string;
}): ClaimWindowProgress | null {
  const unlockAt = args.unlockAt ?? null;
  const deadlineAt = args.deadlineAt ?? null;
  if (!unlockAt) return null;

  if (args.done) {
    return {
      phase: 'done',
      percent: 100,
      label: args.doneLabel ?? 'Closed',
      detail: 'This lock is no longer active.',
    };
  }

  const now = args.now;
  const start = args.createdAt && args.createdAt < unlockAt ? args.createdAt : unlockAt - 60_000;

  if (now < unlockAt) {
    const span = Math.max(unlockAt - start, 1);
    const percent = Math.max(0, Math.min(99, Math.floor(((now - start) / span) * 100)));
    return {
      phase: 'locking',
      percent,
      label: formatRemaining(unlockAt - now),
      detail: 'Waiting for unlock. Claimers cannot take funds yet.',
    };
  }

  if (deadlineAt && now >= deadlineAt) {
    return {
      phase: 'expired',
      percent: 100,
      label: 'Deadline passed',
      detail: 'Claim window closed. The creator can reclaim unclaimed funds.',
    };
  }

  if (deadlineAt && now >= unlockAt) {
    const span = Math.max(deadlineAt - unlockAt, 1);
    const percent = Math.max(0, Math.min(99, Math.floor(((now - unlockAt) / span) * 100)));
    return {
      phase: 'claimable',
      percent,
      label: formatRemaining(deadlineAt - now),
      detail: 'Claim window open. Claimers can take funds until the deadline.',
    };
  }

  return {
    phase: 'claimable',
    percent: 100,
    label: 'Unlocked',
    detail: 'Unlocked with no deadline. Claimers can take funds anytime.',
  };
}
