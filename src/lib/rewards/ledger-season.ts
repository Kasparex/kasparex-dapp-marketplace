/** Ledger bucket for hub PTS entries (replaces monthly UTC season IDs for new writes). */
export type LedgerSeasonBucket = 'hub' | 'legacy' | (string & {});

export function currentLedgerSeasonBucket(): 'hub' {
  return 'hub';
}
