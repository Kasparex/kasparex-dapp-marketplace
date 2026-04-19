import type { ActiveBoost, TyconGameState } from '@/lib/game/engine';
import { hydrateTyconState } from '@/lib/game/engine';

export async function fetchDiamondVeinsServerState(address: string): Promise<TyconGameState | null> {
  const res = await fetch(`/api/games/diamond-veins/state?address=${encodeURIComponent(address)}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const j = (await res.json()) as { state: TyconGameState | null; found?: boolean };
  return j.found && j.state ? hydrateTyconState(j.state) : null;
}

export async function pushDiamondVeinsServerSnapshot(
  address: string,
  state: TyconGameState
): Promise<{ state: TyconGameState; appliedAutoEvents?: boolean } | null> {
  const res = await fetch('/api/games/diamond-veins/state', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ address, state }),
  });
  if (!res.ok) return null;
  const j = (await res.json()) as { state: TyconGameState; appliedAutoEvents?: boolean };
  return j.state ? { state: hydrateTyconState(j.state), appliedAutoEvents: j.appliedAutoEvents } : null;
}

export async function registerGarageReceipt(params: {
  address: string;
  state: TyconGameState;
  receiptId: string;
  txHash: string;
  currency: 'KREX' | 'KAS';
  amount: number;
  itemId: string;
  boost: ActiveBoost;
}): Promise<{ state: TyconGameState } | { error: string; status: number }> {
  const res = await fetch('/api/games/diamond-veins/receipt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(params),
  });
  const j = (await res.json()) as { error?: string; state?: TyconGameState };
  if (!res.ok) {
    if (res.status === 409 && j.state) {
      return { state: hydrateTyconState(j.state) };
    }
    return { error: j.error ?? 'Receipt failed', status: res.status };
  }
  if (!j.state) {
    return { error: 'Missing state in response', status: 500 };
  }
  return { state: hydrateTyconState(j.state) };
}
