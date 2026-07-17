/**
 * Client-side datetime checks for covenant create forms.
 * Surfaces as Calculation Breakdown alerts below the primary action.
 */

export type CovenantFormAlertTone = 'error' | 'warning' | 'info';

export type CovenantFormAlert = {
  id: string;
  tone: CovenantFormAlertTone;
  message: string;
};

export function parseDatetimeLocal(value: string | null | undefined): number | null {
  if (!value?.trim()) return null;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

const SHORT_CLAIM_WINDOW_MS = 60 * 60_000;
const PAST_GRACE_MS = 30_000;

/** Timelock unlock + claim deadline rules. */
export function validateTimelockWindow(args: {
  unlockLocal: string;
  deadlineLocal: string;
  now?: number;
}): CovenantFormAlert[] {
  const now = args.now ?? Date.now();
  const alerts: CovenantFormAlert[] = [];
  const unlockAt = parseDatetimeLocal(args.unlockLocal);
  const deadlineAt = parseDatetimeLocal(args.deadlineLocal);

  if (!args.unlockLocal.trim()) {
    alerts.push({
      id: 'unlock-missing',
      tone: 'error',
      message: 'Choose an unlock time for this timelock.',
    });
  } else if (unlockAt == null) {
    alerts.push({
      id: 'unlock-invalid',
      tone: 'error',
      message: 'Unlock time is invalid. Pick a valid date and time.',
    });
  } else if (unlockAt < now - PAST_GRACE_MS) {
    alerts.push({
      id: 'unlock-past',
      tone: 'error',
      message: 'Unlock time is in the past. Choose a time in the future.',
    });
  } else if (unlockAt < now + 15_000) {
    alerts.push({
      id: 'unlock-soon',
      tone: 'warning',
      message: 'Unlock is almost immediate. Claimers may be able to claim within seconds.',
    });
  }

  if (!args.deadlineLocal.trim()) {
    alerts.push({
      id: 'deadline-missing',
      tone: 'error',
      message: 'Choose a claim deadline so you can reclaim if nobody claims.',
    });
  } else if (deadlineAt == null) {
    alerts.push({
      id: 'deadline-invalid',
      tone: 'error',
      message: 'Claim deadline is invalid. Pick a valid date and time.',
    });
  } else if (unlockAt != null && deadlineAt <= unlockAt) {
    alerts.push({
      id: 'deadline-before-unlock',
      tone: 'error',
      message: 'Claim deadline must be after the unlock time.',
    });
  } else if (deadlineAt < now - PAST_GRACE_MS) {
    alerts.push({
      id: 'deadline-past',
      tone: 'error',
      message: 'Claim deadline is in the past. Choose a future time after unlock.',
    });
  } else if (unlockAt != null && deadlineAt - unlockAt < SHORT_CLAIM_WINDOW_MS) {
    alerts.push({
      id: 'deadline-short',
      tone: 'warning',
      message: 'Claim window is under 1 hour. Claimers may miss it if they are offline.',
    });
  }

  return alerts;
}

/** Per-row milestone unlock/deadline checks. */
export function validateMilestoneRows(
  rows: { label: string; unlock: string; deadline: string }[],
  now = Date.now(),
): CovenantFormAlert[] {
  return rows.flatMap((row, index) => {
    const name = row.label.trim() || `Milestone ${index + 1}`;
    const unlockAt = parseDatetimeLocal(row.unlock);
    const deadlineAt = parseDatetimeLocal(row.deadline);
    const out: CovenantFormAlert[] = [];

    if (!row.unlock.trim() || unlockAt == null) {
      out.push({
        id: `ms-${index}-unlock`,
        tone: 'error',
        message: `${name}: unlock time is missing or invalid.`,
      });
    } else if (unlockAt < now - PAST_GRACE_MS) {
      out.push({
        id: `ms-${index}-unlock-past`,
        tone: 'error',
        message: `${name}: unlock time is in the past.`,
      });
    }

    if (!row.deadline.trim() || deadlineAt == null) {
      out.push({
        id: `ms-${index}-deadline`,
        tone: 'error',
        message: `${name}: claim deadline is missing or invalid.`,
      });
    } else if (unlockAt != null && deadlineAt <= unlockAt) {
      out.push({
        id: `ms-${index}-deadline-order`,
        tone: 'error',
        message: `${name}: claim deadline must be after unlock.`,
      });
    } else if (deadlineAt < now - PAST_GRACE_MS) {
      out.push({
        id: `ms-${index}-deadline-past`,
        tone: 'error',
        message: `${name}: claim deadline is in the past.`,
      });
    } else if (unlockAt != null && deadlineAt - unlockAt < SHORT_CLAIM_WINDOW_MS) {
      out.push({
        id: `ms-${index}-deadline-short`,
        tone: 'warning',
        message: `${name}: claim window is under 1 hour.`,
      });
    }

    return out;
  });
}

/** Crowdfund / voucher style single future deadline. */
export function validateFutureDeadline(
  value: string,
  opts?: { label?: string; now?: number },
): CovenantFormAlert[] {
  const label = opts?.label ?? 'Deadline';
  const now = opts?.now ?? Date.now();
  if (!value.trim()) {
    return [
      {
        id: 'deadline-missing',
        tone: 'error',
        message: `Choose a ${label.toLowerCase()}.`,
      },
    ];
  }
  const ms = parseDatetimeLocal(value);
  if (ms == null) {
    return [
      {
        id: 'deadline-invalid',
        tone: 'error',
        message: `${label} is invalid. Pick a valid date and time.`,
      },
    ];
  }
  if (ms < now - PAST_GRACE_MS) {
    return [
      {
        id: 'deadline-past',
        tone: 'error',
        message: `${label} is in the past. Choose a time in the future.`,
      },
    ];
  }
  if (ms < now + 60_000) {
    return [
      {
        id: 'deadline-soon',
        tone: 'warning',
        message: `${label} is under a minute away.`,
      },
    ];
  }
  return [];
}

export function hasBlockingCovenantAlert(alerts: CovenantFormAlert[]): boolean {
  return alerts.some((a) => a.tone === 'error');
}
