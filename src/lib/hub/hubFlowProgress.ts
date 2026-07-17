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
};

/** Report the active wallet / tx stage from async clients (deploy, fee, claim). */
export function reportHubFlowStep(stepId: string, preset?: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(
      new CustomEvent<HubFlowReportDetail>(HUB_FLOW_EVENT, {
        detail: { stepId, preset },
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

/** Covenant claim: Verify → Sign fee → Sign claim → Complete */
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

  /** Generic Hub L1 publish (tokens, vBlog, store listing, CrowdKas) */
  hubPublish: [
    {
      id: 'prepare',
      label: 'Prepare',
      tooltip: 'Validates your form and builds the payment / payload.',
    },
    {
      id: 'sign',
      label: 'Sign',
      tooltip: 'Wallet prompt 1 of 1: approve the listing / publish transaction in your connected wallet.',
    },
    {
      id: 'pay',
      label: 'Pay',
      tooltip: 'Broadcasts the Hub fee / listing payment on Kaspa.',
    },
    {
      id: 'complete',
      label: 'Complete',
      tooltip: 'Submission finished. Your listing or content is saved.',
    },
  ] satisfies HubFlowStep[],

  /** Store product checkout */
  hubCheckout: [
    {
      id: 'review',
      label: 'Review',
      tooltip: 'Confirm price, currency, and platform fee before paying.',
    },
    {
      id: 'sign',
      label: 'Sign',
      tooltip: 'Wallet prompt 1 of 1: approve the purchase transaction in your wallet.',
    },
    {
      id: 'pay',
      label: 'Pay',
      tooltip: 'Sends payment to the seller and Hub fee where applicable.',
    },
    {
      id: 'complete',
      label: 'Complete',
      tooltip: 'Purchase confirmed. Check your wallet and order status.',
    },
  ] satisfies HubFlowStep[],

  /** Simple dApp pay / tip / donate style actions */
  hubPay: [
    {
      id: 'review',
      label: 'Review',
      tooltip: 'Check the amount and fee breakdown before continuing.',
    },
    {
      id: 'sign',
      label: 'Sign',
      tooltip: 'Wallet prompt 1 of 1: approve the payment in your wallet when prompted.',
    },
    {
      id: 'confirm',
      label: 'Confirm',
      tooltip: 'Wait for the network to accept the transaction.',
    },
    {
      id: 'complete',
      label: 'Complete',
      tooltip: 'Payment finished successfully.',
    },
  ] satisfies HubFlowStep[],
} as const;

export type HubFlowPresetKey = keyof typeof HUB_FLOW_PRESETS;

export function getHubFlowPreset(key: HubFlowPresetKey): HubFlowStep[] {
  return [...HUB_FLOW_PRESETS[key]];
}
