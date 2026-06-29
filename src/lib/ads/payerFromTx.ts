import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';
import type { KaspaRestTransaction } from '@/lib/kaspa/api';

function normAddr(a: string): string {
  try {
    return normalizeKaspaAddress(a);
  } catch {
    return a;
  }
}

function addPayerAddress(set: Set<string>, raw: string | null | undefined): void {
  if (!raw || typeof raw !== 'string') return;
  const trimmed = raw.trim();
  if (!trimmed) return;
  const withPrefix = trimmed.toLowerCase().startsWith('kaspa:') ? trimmed : `kaspa:${trimmed}`;
  try {
    set.add(normAddr(withPrefix));
  } catch {
    if (trimmed.startsWith('kaspa:')) set.add(trimmed);
  }
}

/** Collect normalized payer addresses from resolved transaction inputs. */
export function payerAddressesFromTx(tx: KaspaRestTransaction): Set<string> {
  const set = new Set<string>();
  for (const inp of tx.inputs ?? []) {
    const i = inp as Record<string, unknown>;
    const vd = i.verboseData ?? i.verbose_data;
    const fromVerbose =
      vd && typeof vd === 'object' && typeof (vd as { address?: string }).address === 'string'
        ? (vd as { address: string }).address
        : undefined;
    const a = inp.previous_outpoint_address ?? inp.previousOutpointAddress ?? fromVerbose;
    addPayerAddress(set, a);
  }
  return set;
}
