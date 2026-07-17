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

export const HUB_FLOW_PRESETS = {
  /** Covenant deploy / create lock */
  covenantCreate: [
    {
      id: 'create',
      label: 'Create',
      tooltip: 'Start the lock. Your form values are validated and the on-chain build begins.',
    },
    {
      id: 'sign',
      label: 'Sign',
      tooltip: 'Approve the covenant lock transaction in your Kaspa wallet.',
    },
    {
      id: 'pay-fee',
      label: 'Pay Fee',
      tooltip: 'Confirm the separate Hub platform fee transfer to treasury.',
    },
    {
      id: 'complete',
      label: 'Complete',
      tooltip: 'Lock is recorded. You can find it on the Vaults / list tab.',
    },
  ] satisfies HubFlowStep[],

  /** Covenant claim / redeem / unlock */
  covenantClaim: [
    {
      id: 'verify',
      label: 'Verify',
      tooltip: 'Checks that this lock is claimable and resolves the on-chain UTXO.',
    },
    {
      id: 'sign',
      label: 'Sign',
      tooltip: 'Approve the Hub claim fee (or claim) signature in your wallet.',
    },
    {
      id: 'claim',
      label: 'Claim',
      tooltip: 'Broadcasts the unlock / claim spend to receive the locked KAS.',
    },
    {
      id: 'complete',
      label: 'Complete',
      tooltip: 'Claim finished. Funds should appear in your wallet after confirmation.',
    },
  ] satisfies HubFlowStep[],

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
      tooltip: 'Approve the transaction in your connected wallet.',
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
      tooltip: 'Approve the purchase transaction in your wallet.',
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
      tooltip: 'Approve the payment in your wallet when prompted.',
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
