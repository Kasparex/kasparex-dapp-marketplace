import type { KpxRecordV1 } from './types';

export type KpxRecordWithMeta<T extends KpxRecordV1 = KpxRecordV1> = {
  record: T;
  txHash: string;
  blockHeight?: number;
};

export function resolveHighestSeq<T extends KpxRecordV1>(
  records: Array<KpxRecordWithMeta<T>>
): KpxRecordWithMeta<T> | null {
  if (!records.length) return null;
  let best: KpxRecordWithMeta<T> | null = null;
  for (const r of records) {
    if (!best) {
      best = r;
      continue;
    }
    const a = r.record.seq;
    const b = best.record.seq;
    if (a > b) {
      best = r;
      continue;
    }
    if (a < b) continue;
    const ah = r.blockHeight ?? 0;
    const bh = best.blockHeight ?? 0;
    if (ah > bh) {
      best = r;
      continue;
    }
    if (ah < bh) continue;
    if (String(r.txHash) > String(best.txHash)) best = r;
  }
  return best;
}

