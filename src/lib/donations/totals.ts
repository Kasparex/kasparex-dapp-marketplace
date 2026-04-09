/**
 * CrowdKAS display totals: L2 escrow (raisedWei / donorCount) + L1-recorded amounts (same wei unit for UI).
 */

export type DonationAmountFields = {
  raisedWei: bigint;
  donorCount: bigint;
  l1RecordedTotalWei?: bigint;
  l1RecordedDonationCount?: bigint;
};

export function totalRaisedWei(c: DonationAmountFields): bigint {
  return c.raisedWei + (c.l1RecordedTotalWei ?? 0n);
}

export function totalDonorCount(c: DonationAmountFields): bigint {
  return c.donorCount + (c.l1RecordedDonationCount ?? 0n);
}

export function progressPercent(c: DonationAmountFields, targetWei: bigint): number {
  if (targetWei <= 0n) return 0;
  const raised = totalRaisedWei(c);
  return Math.min(100, Number((raised * 10000n) / targetWei) / 100);
}
