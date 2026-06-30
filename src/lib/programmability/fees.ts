/**
 * Post-Toccata minimum standard fee (client-side estimate only).
 * Wallets own final fee estimation; this helper is for UI hints and manual builders.
 *
 * Rule: 100 sompi × max(compute grams, 2 × transaction bytes)
 */
export function estimateMinimumStandardFeeSompi(args: {
  computeGrams: number;
  txBytes: number;
}): bigint {
  const grams = Math.max(0, Math.floor(args.computeGrams));
  const bytes = Math.max(0, Math.floor(args.txBytes));
  const factor = Math.max(grams, 2 * bytes);
  return BigInt(100 * factor);
}

export function formatMinimumFeeKas(sompi: bigint): string {
  const kas = Number(sompi) / 1e8;
  if (kas === 0) return '0 KAS';
  if (kas < 0.00001) return `${sompi} sompi`;
  return `${kas.toLocaleString(undefined, { maximumFractionDigits: 8 })} KAS`;
}
