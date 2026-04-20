import { sendKaspaTransaction } from '@/lib/kaspa/wallet';
import { kasToSompis } from '@/lib/kaspa/api';
import { buildKasparexL1PaymentNote } from '@/lib/core/l1PaymentNote';
import { getKasparexWorkerBaseUrl } from './config';

export async function payKaspaL1(params: {
  provider: unknown;
  fromKaspaAddress: string;
  toKaspaAddress: string;
  amountKas: number;
  gameId?: string;
  skuId?: string;
  purchaseType?: 'entry' | 'boost' | 'unlock' | 'slot' | 'other';
  sessionId?: string;
  evmAddress?: string;
}): Promise<{ ok: true; txHash: string; sessionId: string } | { ok: false; error: string }> {
  try {
    const sessionId = params.sessionId ?? crypto.randomUUID();
    const note = buildKasparexL1PaymentNote({
      gameId: params.gameId,
      skuId: params.skuId,
      sessionId,
      evmAddress: params.evmAddress,
    });
    const sompiAmount = kasToSompis(params.amountKas);
    const result = await sendKaspaTransaction(params.provider as any, {
      to: params.toKaspaAddress,
      amount: sompiAmount.toString(),
      note,
    });
    if (result.status === 'failed') {
      return { ok: false, error: result.error || 'Transaction failed' };
    }
    return { ok: true, txHash: result.txHash, sessionId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Payment failed' };
  }
}

export async function verifyKaspaL1Payment(params: {
  txHash: string;
  payerKaspaAddress: string;
  toKaspaAddress: string;
  minAmountKas: number;
  gameId?: string;
  skuId: string;
  purchaseType?: 'entry' | 'boost' | 'unlock' | 'slot' | 'other';
  sessionId?: string;
  evmAddress?: string;
}): Promise<{ ok: true; diamondsMinted?: number } | { ok: false; error?: string }> {
  const workerBase = getKasparexWorkerBaseUrl();
  if (!workerBase) return { ok: false };

  try {
    const res = await fetch(`${workerBase}/kasparex/payments/l1/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        txHash: params.txHash,
        payerKaspaAddress: params.payerKaspaAddress,
        toKaspaAddress: params.toKaspaAddress,
        minAmountKas: params.minAmountKas,
        gameId: params.gameId,
        skuId: params.skuId,
        purchaseType: params.purchaseType ?? 'other',
        sessionId: params.sessionId,
        evmAddress: params.evmAddress,
      }),
    });

    if (!res.ok) {
      const j = (await res.json().catch(() => null)) as { error?: string } | null;
      return { ok: false, error: j?.error };
    }
    const j = (await res.json()) as { diamondsMinted?: number };
    return { ok: true, diamondsMinted: j.diamondsMinted };
  } catch {
    return { ok: false };
  }
}

