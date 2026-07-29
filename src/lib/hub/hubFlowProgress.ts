/**
 * Standard transaction Flow Progress for Hub calculation breakdown panels.
 * Short labels + tooltips; live step updates via reportHubFlowStep / props.
 */

export type HubFlowStep = {
  id: string;
  label: string;
  tooltip: string;
};

export type HubFlowProgressModel = {
  steps: HubFlowStep[];
  /**
   * 0-based active step. Values >= steps.length mean all complete.
   * Idle / ready-to-start uses 0 (first step highlighted as next).
   */
  currentIndex: number;
};

const HUB_FLOW_EVENT = 'kasparex-hub-flow';

export type HubFlowReportDetail = {
  stepId: string;
  /** Optional preset key for listeners that switch flows (e.g. create vs claim). */
  preset?: string;
  /** Optional status line for the Flow Progress UI (e.g. settle wait). */
  message?: string;
};

/** Report the active wallet / tx stage from async clients (deploy, fee, claim). */
export function reportHubFlowStep(stepId: string, preset?: string, message?: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(
      new CustomEvent<HubFlowReportDetail>(HUB_FLOW_EVENT, {
        detail: { stepId, preset, message },
      }),
    );
  } catch {
    /* ignore */
  }
}

export function subscribeHubFlowStep(
  listener: (detail: HubFlowReportDetail) => void,
): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (event: Event) => {
    const detail = (event as CustomEvent<HubFlowReportDetail>).detail;
    if (detail?.stepId) listener(detail);
  };
  window.addEventListener(HUB_FLOW_EVENT, handler);
  return () => window.removeEventListener(HUB_FLOW_EVENT, handler);
}

export function hubFlowStepIndex(steps: HubFlowStep[], stepId: string): number {
  const idx = steps.findIndex((s) => s.id === stepId);
  return idx >= 0 ? idx : 0;
}

/** Resolve display index from busy / complete / live step id. */
export function resolveHubFlowCurrentIndex(args: {
  steps: HubFlowStep[];
  busy?: boolean;
  complete?: boolean;
  /** Explicit step id (from reportHubFlowStep or caller). */
  activeStepId?: string | null;
  /** When busy with no step id yet, highlight this index (default: 1 = Sign). */
  busyFallbackIndex?: number;
}): number {
  const { steps } = args;
  if (steps.length === 0) return 0;
  if (args.complete) return steps.length;
  if (args.activeStepId) {
    if (args.activeStepId === 'complete') return steps.length;
    return hubFlowStepIndex(steps, args.activeStepId);
  }
  if (args.busy) {
    const fallback = args.busyFallbackIndex ?? Math.min(1, steps.length - 1);
    return Math.max(0, Math.min(fallback, steps.length - 1));
  }
  return 0;
}

function promptOf(n: number, total: number): string {
  return `Wallet prompt ${n} of ${total}`;
}

/** Covenant deploy / create: Create → Sign (×locks) → Pay Fee → Complete */
export function buildCovenantCreateFlowSteps(args?: {
  /** How many lock / share txs the user must sign before the Hub fee. */
  lockSignCount?: number;
  feeWaived?: boolean;
}): HubFlowStep[] {
  const lockCount = Math.max(1, Math.floor(args?.lockSignCount ?? 1));
  const feeWaived = Boolean(args?.feeWaived);
  const totalPrompts = lockCount + (feeWaived ? 0 : 1);

  const signLabel = lockCount > 1 ? `Sign ×${lockCount}` : 'Sign';
  const signTooltip =
    lockCount > 1
      ? `${lockCount} lock signatures (${promptOf(1, totalPrompts)} through ${promptOf(lockCount, totalPrompts)}) in your Kaspa wallet.`
      : `${promptOf(1, totalPrompts)}: approve the covenant lock transaction in your Kaspa wallet.`;

  const steps: HubFlowStep[] = [
    {
      id: 'create',
      label: 'Create',
      tooltip: 'Start the lock. Your form values are validated and the on-chain build begins.',
    },
    {
      id: 'sign',
      label: signLabel,
      tooltip: signTooltip,
    },
  ];

  if (!feeWaived) {
    steps.push({
      id: 'pay-fee',
      label: 'Pay Fee',
      tooltip: `${promptOf(totalPrompts, totalPrompts)}: confirm the Hub platform fee transfer to treasury.`,
    });
  }

  steps.push({
    id: 'complete',
    label: 'Complete',
    tooltip: 'Lock is recorded. You can find it on the Vaults / list tab.',
  });

  return steps;
}

/** Covenant claim: Verify → Sign Fee → Wait → Sign Claim → Complete */
export function buildCovenantClaimFlowSteps(args?: { feeWaived?: boolean }): HubFlowStep[] {
  const feeWaived = Boolean(args?.feeWaived);
  const totalPrompts = feeWaived ? 1 : 2;

  const steps: HubFlowStep[] = [
    {
      id: 'verify',
      label: 'Verify',
      tooltip: 'Checks that this lock is claimable and resolves the on-chain UTXO.',
    },
  ];

  if (!feeWaived) {
    steps.push({
      id: 'sign-fee',
      label: 'Sign Fee',
      tooltip: `${promptOf(1, totalPrompts)}: approve the Hub claim fee in your Kaspa wallet.`,
    });
    steps.push({
      id: 'settle',
      label: 'Wait',
      tooltip:
        'Waiting for the fee transaction to confirm so the claim can use updated UTXOs. This can take a few moments before the next wallet prompt.',
    });
  }

  steps.push({
    id: 'claim',
    label: 'Sign Claim',
    tooltip: `${promptOf(totalPrompts, totalPrompts)}: approve the unlock / claim spend to receive the locked KAS.`,
  });

  steps.push({
    id: 'complete',
    label: 'Complete',
    tooltip: 'Claim finished. Funds should appear in your wallet after confirmation.',
  });

  return steps;
}

export const HUB_FLOW_PRESETS = {
  /** Covenant deploy / create lock (single lock + fee). */
  covenantCreate: buildCovenantCreateFlowSteps({ lockSignCount: 1, feeWaived: false }),

  /** Covenant claim / redeem / unlock (fee + claim). */
  covenantClaim: buildCovenantClaimFlowSteps({ feeWaived: false }),

  /**
   * Hub L1 publish (tokens, vBlog, store listing, CrowdKas).
   * Sign and pay are one wallet action.
   */
  hubPublish: [
    {
      id: 'prepare',
      label: 'Prepare',
      tooltip: 'Validates your form and builds the payment / payload.',
    },
    {
      id: 'sign-pay',
      label: 'Sign & Pay',
      tooltip: 'Wallet prompt 1 of 1: approve and broadcast the listing payment in your wallet.',
    },
    {
      id: 'complete',
      label: 'Complete',
      tooltip: 'Submission finished. Your listing or content is saved.',
    },
  ] satisfies HubFlowStep[],

  /** Store product checkout: Sign and pay are one wallet action. */
  hubCheckout: [
    {
      id: 'review',
      label: 'Review',
      tooltip: 'Confirm price, currency, and platform fee before paying.',
    },
    {
      id: 'sign-pay',
      label: 'Sign & Pay',
      tooltip: 'Wallet prompt 1 of 1: approve and send the purchase in your wallet.',
    },
    {
      id: 'complete',
      label: 'Complete',
      tooltip: 'Purchase confirmed. Check your wallet and order status.',
    },
  ] satisfies HubFlowStep[],

  /** Simple dApp pay / tip / donate: Sign and pay are one wallet action. */
  hubPay: [
    {
      id: 'review',
      label: 'Review',
      tooltip: 'Check the amount and fee breakdown before continuing.',
    },
    {
      id: 'sign-pay',
      label: 'Sign & Pay',
      tooltip: 'Wallet prompt 1 of 1: approve the payment in your wallet when prompted.',
    },
    {
      id: 'complete',
      label: 'Complete',
      tooltip: 'Payment finished successfully.',
    },
  ] satisfies HubFlowStep[],

  /**
   * Reader premium unlock (author payout + optional Hub fee).
   * Prefer buildHubReaderUnlockFlowSteps() when author split count varies.
   */
  hubReaderUnlock: buildHubReaderUnlockFlowSteps({ authorSignCount: 1, hasPlatformFee: true }),
} as const;

export type HubFlowPresetKey = keyof typeof HUB_FLOW_PRESETS;

export function getHubFlowPreset(key: HubFlowPresetKey): HubFlowStep[] {
  return [...HUB_FLOW_PRESETS[key]];
}

/** Reader unlock / tip: Review → Pay Author (×N) → Pay Fee? → Verify → Complete */
export function buildHubReaderUnlockFlowSteps(args?: {
  authorSignCount?: number;
  hasPlatformFee?: boolean;
}): HubFlowStep[] {
  const authorCount = Math.max(1, Math.floor(args?.authorSignCount ?? 1));
  const hasFee = args?.hasPlatformFee !== false;
  const totalPrompts = authorCount + (hasFee ? 1 : 0);

  const authorLabel = authorCount > 1 ? `Pay Author ×${authorCount}` : 'Pay Author';
  const authorTooltip =
    authorCount > 1
      ? `${authorCount} author payout signatures (${promptOf(1, totalPrompts)} through ${promptOf(authorCount, totalPrompts)}).`
      : `${promptOf(1, totalPrompts)}: send the author payout in your Kaspa wallet.`;

  const steps: HubFlowStep[] = [
    {
      id: 'review',
      label: 'Review',
      tooltip: 'Confirm unlock price, currency, and fee breakdown before paying.',
    },
    {
      id: 'pay-author',
      label: authorLabel,
      tooltip: authorTooltip,
    },
  ];

  if (hasFee) {
    steps.push({
      id: 'pay-fee',
      label: 'Pay Fee',
      tooltip: `${promptOf(totalPrompts, totalPrompts)}: confirm the Hub platform fee to treasury.`,
    });
  }

  steps.push(
    {
      id: 'verify',
      label: 'Verify',
      tooltip: 'Confirms payments on Kaspa L1, then unlocks content in this browser.',
    },
    {
      id: 'complete',
      label: 'Complete',
      tooltip: 'Unlocked. You can keep reading premium content on this device.',
    },
  );

  return steps;
}
