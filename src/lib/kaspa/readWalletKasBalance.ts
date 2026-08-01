/**
 * Global KAS balance read for Hub payment pre-checks.
 * Prefer the connected wallet; never surface raw upstream "Kaspa API error: 404" to buyers.
 */

import { getBalanceInKas, sompisToKas } from '@/lib/kaspa/api';
import { getWalletProvider } from '@/lib/kaspa/wallet';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';

function extractNumericBalance(raw: unknown): number | null {
  if (raw == null) return null;
  if (typeof raw === 'string' || typeof raw === 'number') {
    const n = typeof raw === 'string' ? parseFloat(raw) : raw;
    return Number.isFinite(n) && n >= 0 ? n : null;
  }
  if (typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  for (const key of ['balance', 'amount', 'value', 'total', 'kas']) {
    if (key in obj) {
      const n = extractNumericBalance(obj[key]);
      if (n != null) return n;
    }
  }
  for (const val of Object.values(obj)) {
    if (typeof val === 'number' || (typeof val === 'string' && !Number.isNaN(parseFloat(val)))) {
      const n = extractNumericBalance(val);
      if (n != null) return n;
    }
  }
  return null;
}

function normalizeWalletBalanceToKas(balanceNum: number): number {
  const strValue = balanceNum.toString();
  const hasDecimals = strValue.includes('.');
  const decimalPlaces = hasDecimals ? strValue.split('.')[1]?.length || 0 : 0;
  // Tiny values with many decimals are already KAS; otherwise treat as sompi.
  if (balanceNum < 0.01 && decimalPlaces > 6) return balanceNum;
  return sompisToKas(balanceNum);
}

/**
 * Returns KAS balance when known, or null when the balance cannot be read.
 * Callers should only block payment when a positive known balance is below need.
 */
export async function readWalletKasBalance(args: {
  provider: KaspaWalletProvider;
  address: string;
}): Promise<number | null> {
  const wallet = getWalletProvider(args.provider);
  if (wallet?.getBalance) {
    try {
      const raw = await wallet.getBalance();
      const numeric = extractNumericBalance(raw);
      if (numeric != null) return normalizeWalletBalanceToKas(numeric);
    } catch {
      /* fall through to REST */
    }
  }

  try {
    return await getBalanceInKas(args.address);
  } catch {
    return null;
  }
}

/** Soft pre-check: only throws when balance is known and too low. */
export async function assertSufficientKasBalance(args: {
  provider: KaspaWalletProvider;
  address: string;
  needKas: number;
  label?: string;
}): Promise<void> {
  if (!(args.needKas > 0)) return;
  const balance = await readWalletKasBalance({
    provider: args.provider,
    address: args.address,
  });
  if (balance == null) return;
  if (balance + 1e-8 >= args.needKas) return;
  const what = args.label ?? 'this payment';
  throw new Error(
    `Insufficient KAS balance. You have ${balance.toFixed(4)} KAS; ${what} needs ${args.needKas.toFixed(4)} KAS.`,
  );
}
