import { kasToSompi } from '@/lib/ads/config';
import { formatKaspaWalletError } from '@/lib/kaspa/formatWalletError';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import {
  isStorageMassErrorMessage,
  readHighMassMode,
  retryKasCandidates,
} from '@/lib/kaspa/tx-mass-mode';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import { sendKaspaTransaction } from '@/lib/kaspa/wallet';

/**
 * Send a reader unlock / tip KAS payment with on-chain payload binding.
 * Payload only (no duplicate note) to keep transient mass lower.
 * Retries with larger amounts when the wallet hits storage mass limits.
 * Verify endpoints accept overpayment (minimum checks only).
 */
export async function sendVBlogReaderKasTx(args: {
  provider: KaspaWalletProvider;
  to: string;
  amountKas: number;
  payloadHex: string;
}): Promise<{ txHash: string; paidKas: number }> {
  const baseKas = Math.max(0.02, Number(args.amountKas.toFixed(8)));
  const highMass = readHighMassMode();
  const candidates = retryKasCandidates(baseKas, highMass);
  let lastErr: string | null = null;

  for (const candidateKas of candidates) {
    const sompi = kasToSompi(candidateKas);
    if (sompi <= 0) continue;

    const txRes = await sendKaspaTransaction(args.provider, {
      to: args.to,
      amount: String(sompi),
      payload: args.payloadHex,
    });

    if (txRes.status !== 'failed' && txRes.txHash) {
      return {
        txHash: extractKaspaTransactionId(txRes.txHash) ?? txRes.txHash,
        paidKas: candidateKas,
      };
    }

    lastErr = txRes.error ?? 'Payment transaction was rejected or failed';
    if (!isStorageMassErrorMessage(formatKaspaWalletError(lastErr))) break;
  }

  throw new Error(formatKaspaWalletError(lastErr ?? 'Payment transaction failed'));
}

export async function parseJsonResponse<T extends Record<string, unknown>>(
  res: Response,
): Promise<T> {
  const text = await res.text();
  if (!text.trim()) {
    throw new Error(
      `Empty response from server (${res.status}). Payment may have succeeded in your wallet; wait a moment and retry unlock, or check transaction history.`,
    );
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      `Invalid response from server (${res.status}). Payment may have succeeded in your wallet; wait a moment and retry unlock, or check transaction history.`,
    );
  }
}
