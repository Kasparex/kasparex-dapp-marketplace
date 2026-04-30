import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';
import { KREX_DECIMALS } from '@/lib/game/diamond-veins-config';

const KASPLEX_BASE = 'https://api.kasplex.org';

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

/** Kasplex lists reveal ids as `hashRev`; wallets/explorers may show byte-reversed id — accept either. */
function reverseHexBytePairs(hex64: string): string {
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

/**
 * Locate the payer→treasury KREX transfer in Kasplex indexer (recent pages).
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
  let cursor: string | undefined;

  for (let page = 0; page < 12; page++) {
    const qs = new URLSearchParams({
      tick: 'KREX',
      from: payerPrefixed,
      limit: '100',
    });
    if (cursor) qs.set('next', cursor);
    const url = `${KASPLEX_BASE}/v1/krc20/oplist?${qs.toString()}`;
    let body: KasplexOplistBody;
    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(14000),
      });
      if (!res.ok) return false;
      body = (await res.json()) as KasplexOplistBody;
    } catch {
      return false;
    }

    const rows = body.result ?? [];
    for (const row of rows) {
      if (row.tick?.toUpperCase() !== 'KREX' || row.op?.toLowerCase() !== 'transfer') continue;
      if (row.opAccept != null && String(row.opAccept) !== '1') continue;
      const hr = row.hashRev ?? '';
      if (!kasplexTxIdsEquivalent(input.krexPaymentTxHash, hr)) continue;
      const fromOk = normAddrLoose(row.from ?? '') === payer;
      const toOk = normAddrLoose(row.to ?? '') === treasury;
      if (!fromOk || !toOk) continue;
      const amtStr = row.amt ?? '0';
      let amt: bigint;
      try {
        amt = BigInt(amtStr);
      } catch {
        continue;
      }
      return amt >= input.minAmtSmallest;
    }

    cursor = body.next;
    if (!cursor) break;
  }

  return false;
}

export function expectedKrexAmtSmallestFromHuman(priceKrex: number): bigint {
  if (!Number.isFinite(priceKrex) || priceKrex <= 0) return 0n;
  const raw = Math.floor(priceKrex * Math.pow(10, KREX_DECIMALS));
  return BigInt(Math.max(0, raw));
}
