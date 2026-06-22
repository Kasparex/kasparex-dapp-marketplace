/**
 * L1 payload / note helpers for binding Hub actions to future covenant txs.
 */

export function buildLockboxCommitNote(args: {
  vaultId: string;
  kind: 'escrow' | 'timelock';
  beneficiary: string;
  amountSompi: string;
}): string {
  const ben = args.beneficiary.replace(/^kaspa:/i, '');
  return `kpx-cov-lock:${args.kind}:${args.vaultId}:${ben}:${args.amountSompi}`;
}

/** Compact recipient list for L1 binding note (address:bps pairs). */
export function buildSplitCommitNote(args: {
  splitId: string;
  totalSompi: string;
  recipients: Array<{ address: string; shareBps: number }>;
}): string {
  const parts = args.recipients
    .map((r) => `${r.address.replace(/^kaspa:/i, '')}:${r.shareBps}`)
    .join(',');
  return `kpx-cov-split:${args.splitId}:${args.totalSompi}:${parts}`;
}
