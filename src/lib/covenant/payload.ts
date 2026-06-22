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

export function buildMilestoneCommitNote(args: {
  dealId: string;
  totalSompi: string;
  beneficiary: string;
}): string {
  return `kpx-cov-milestone:${args.dealId}:${args.totalSompi}:${args.beneficiary.replace(/^kaspa:/i, '')}`;
}

export function buildCrowdfundPledgeNote(args: {
  campaignId: string;
  amountSompi: string;
}): string {
  return `kpx-cov-crowdfund:${args.campaignId}:${args.amountSompi}`;
}

export function buildVoucherCommitNote(args: {
  voucherId: string;
  amountSompi: string;
  secretHash: string;
}): string {
  return `kpx-cov-voucher:${args.voucherId}:${args.amountSompi}:${args.secretHash.slice(0, 16)}`;
}
