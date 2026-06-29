import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';
import { KREX_DECIMALS } from '@/lib/game/diamond-veins-config';

const KASPLEX_BASES = ['https://api.kasplex.org', 'https://indexer.kasplex.org'];

type KasplexKrexOp = {
  p?: string;
  op?: string;
  tick?: string;
  amt?: string;
  from?: string;
  to?: string;
  hashRev?: string;
  opAccept?: string;
};

type KasplexOplistBody = {
  message?: string;
  next?: string;
  result?: KasplexKrexOp[];
};

function normalizeHexTx(h: string): string {
  return h.trim().replace(/^0x/i, '').toLowerCase();
}

/** Kasplex lists reveal ids as `hashRev`; wallets/explorers may show byte-reversed id - accept either. */
export function reverseHexBytePairs(hex64: string): string {
  const h = normalizeHexTx(hex64);
  if (h.length % 2 !== 0) return h;
  const pairs: string[] = [];
  for (let i = 0; i < h.length; i += 2) pairs.push(h.slice(i, i + 2));
  return pairs.reverse().join('');
}

export function kasplexTxIdsEquivalent(walletTxId: string, hashRev: string): boolean {
  const a = normalizeHexTx(walletTxId);
  const b = normalizeHexTx(hashRev);
  if (a.length === 64 && b.length === 64 && (a === b || reverseHexBytePairs(a) === b || a === reverseHexBytePairs(b))) {
    return true;
  }
  return a === b;
}

function normAddrLoose(a: string): string {
  try {
    return normalizeKaspaAddress(a).toLowerCase();
  } catch {
    return a.replace(/^kaspa:/i, '').trim().toLowerCase();
  }
}

function parseKrc20OpBody(data: unknown): KasplexKrexOp | null {
  if (!data || typeof data !== 'object') return null;
  const o = data as Record<string, unknown>;
  if (o.result && typeof o.result === 'object') return o.result as KasplexKrexOp;
  return o as KasplexKrexOp;
}

function opAccepted(row: KasplexKrexOp): boolean {
  if (row.opAccept == null) return true;
  return String(row.opAccept) === '1';
}

function rowMatchesKrexTransfer(
  row: KasplexKrexOp,
  payer: string,
  treasury: string,
  minAmtSmallest: bigint,
): boolean {
  if (row.tick?.toUpperCase() !== 'KREX' || row.op?.toLowerCase() !== 'transfer') return false;
  if (!opAccepted(row)) return false;
  const fromOk = normAddrLoose(row.from ?? '') === payer;
  const toOk = normAddrLoose(row.to ?? '') === treasury;
  if (!fromOk || !toOk) return false;
  const amtStr = row.amt ?? '0';
  let amt: bigint;
  try {
    amt = BigInt(amtStr);
  } catch {
    return false;
  }
  return amt >= minAmtSmallest;
}

async function fetchKrc20OpByTxId(txId: string): Promise<KasplexKrexOp | null> {
  const normalized = normalizeHexTx(txId);
  if (!/^[0-9a-f]{64}$/.test(normalized)) return null;
  const idCandidates = [normalized, reverseHexBytePairs(normalized)];

  for (const base of KASPLEX_BASES) {
    for (const id of idCandidates) {
      try {
        const res = await fetch(`${base}/v1/krc20/op/${id}`, {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(14000),
        });
        if (!res.ok) continue;
        const row = parseKrc20OpBody((await res.json()) as unknown);
        if (row && row.tick) return row;
      } catch {
        // try next
      }
    }
  }
  return null;
}

async function scanOplistForTransfer(input: {
  payerPrefixed: string;
  payerLoose: string;
  treasuryLoose: string;
  krexPaymentTxHash: string;
  minAmtSmallest: bigint;
}): Promise<boolean> {
  const fromCandidates = [input.payerPrefixed, input.payerPrefixed.replace(/^kaspa:/i, '')];
  let cursor: string | undefined;

  for (let page = 0; page < 12; page++) {
    for (const from of fromCandidates) {
      const qs = new URLSearchParams({
        tick: 'KREX',
        from,
        limit: '100',
      });
      if (cursor) qs.set('next', cursor);

      let body: KasplexOplistBody;
      try {
        const res = await fetch(`${KASPLEX_BASES[0]}/v1/krc20/oplist?${qs.toString()}`, {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(14000),
        });
        if (!res.ok) continue;
        body = (await res.json()) as KasplexOplistBody;
      } catch {
        continue;
      }

      const rows = body.result ?? [];
      for (const row of rows) {
        const hr = row.hashRev ?? '';
        if (!kasplexTxIdsEquivalent(input.krexPaymentTxHash, hr)) continue;
        if (rowMatchesKrexTransfer(row, input.payerLoose, input.treasuryLoose, input.minAmtSmallest)) {
          return true;
        }
      }

      cursor = body.next;
      if (!cursor) break;
    }
    if (!cursor) break;
  }

  return false;
}

/**
 * Locate the payer to treasury KREX transfer in Kasplex (direct op lookup, then oplist fallback).
 */
export async function verifyKrexTreasuryTransfer(input: {
  payerAddress: string;
  treasuryAddress: string;
  krexPaymentTxHash: string;
  minAmtSmallest: bigint;
}): Promise<boolean> {
  let payerPrefixed: string;
  try {
    payerPrefixed = normalizeKaspaAddress(input.payerAddress);
  } catch {
    return false;
  }
  let treasuryPrefixed: string;
  try {
    treasuryPrefixed = normalizeKaspaAddress(input.treasuryAddress);
  } catch {
    return false;
  }
  const payer = normAddrLoose(payerPrefixed);
  const treasury = normAddrLoose(treasuryPrefixed);

  const directOp = await fetchKrc20OpByTxId(input.krexPaymentTxHash);
  if (directOp && rowMatchesKrexTransfer(directOp, payer, treasury, input.minAmtSmallest)) {
    return true;
  }

  return scanOplistForTransfer({
    payerPrefixed,
    payerLoose: payer,
    treasuryLoose: treasury,
    krexPaymentTxHash: input.krexPaymentTxHash,
    minAmtSmallest: input.minAmtSmallest,
  });
}

export function expectedKrexAmtSmallestFromHuman(priceKrex: number): bigint {
  if (!Number.isFinite(priceKrex) || priceKrex <= 0) return 0n;
  const raw = Math.floor(priceKrex * Math.pow(10, KREX_DECIMALS));
  return BigInt(Math.max(0, raw));
}
