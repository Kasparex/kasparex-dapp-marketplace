import { getKasparexWorkerBaseUrl } from './config';

export async function spendDiamonds(params: {
  userAddress: string;
  amount: number;
  sink:
    | 'perk'
    | 'boost'
    | 'unlock'
    | 'insurance'
    | 'reroll'
    | 'cooldown_skip'
    | 'slot_upgrade'
    | 'tournament'
    | 'cosmetic'
    | 'other';
  idempotencyKey: string;
  reason?: string;
  gameId?: string;
}): Promise<{ ok: true; newBalance?: number } | { ok: false; error?: string }> {
  const workerBase = getKasparexWorkerBaseUrl();
  if (!workerBase) return { ok: false, error: 'Worker base URL not configured' };

  const res = await fetch(`${workerBase}/kasparex/diamonds/spend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      userAddress: params.userAddress,
      amount: params.amount,
      sink: params.sink,
      idempotencyKey: params.idempotencyKey,
      reason: params.reason,
      gameId: params.gameId,
    }),
  });

  const j = (await res.json().catch(() => null)) as { error?: string; newBalance?: number } | null;
  if (!res.ok) return { ok: false, error: j?.error ?? 'Spend failed' };
  return { ok: true, newBalance: j?.newBalance };
}

