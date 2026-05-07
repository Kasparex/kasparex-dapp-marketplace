/**
 * Single shared poller for GET /api/kasparex/pts/balance so every
 * useRedeemablePointsBreakdown() consumer does not spawn its own interval.
 */

const POLL_MS = 5000;

type Listener = () => void;

const listeners = new Set<Listener>();

let currentAddr = '';
let balanceSnapshot: number | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let fetchGeneration = 0;

function notify() {
  for (const cb of listeners) cb();
}

async function fetchOnce(addr: string, gen: number) {
  try {
    const r = await fetch(`/api/kasparex/pts/balance?wallet=${encodeURIComponent(addr)}`);
    const j = (await r.json()) as { balance_pts?: number };
    if (gen !== fetchGeneration || addr !== currentAddr) return;
    if (r.ok && typeof j.balance_pts === 'number' && Number.isFinite(j.balance_pts)) {
      balanceSnapshot = Math.max(0, Math.floor(j.balance_pts));
    } else {
      balanceSnapshot = null;
    }
  } catch {
    if (gen === fetchGeneration && addr === currentAddr) balanceSnapshot = null;
  }
  notify();
}

function restartPolling(addr: string) {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  currentAddr = addr;
  balanceSnapshot = null;
  fetchGeneration++;
  const gen = fetchGeneration;
  void fetchOnce(addr, gen);
  pollTimer = setInterval(() => {
    fetchGeneration++;
    void fetchOnce(currentAddr, fetchGeneration);
  }, POLL_MS);
}

function stopIfIdle() {
  if (listeners.size > 0) return;
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  currentAddr = '';
  balanceSnapshot = null;
}

export function getServerHubBalanceForAddr(addr: string): number | null {
  if (!addr || addr !== currentAddr) return null;
  return balanceSnapshot;
}

/** Immediate refetch (same wallet). Safe to call from hub-ledger / minecore events. */
export function refreshServerHubBalance() {
  if (!currentAddr) return;
  fetchGeneration++;
  void fetchOnce(currentAddr, fetchGeneration);
}

export function subscribeServerHubBalance(addr: string, onChange: Listener): () => void {
  const empty = !addr.trim();
  if (!empty && addr !== currentAddr) {
    restartPolling(addr);
  } else if (empty) {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
    currentAddr = '';
    balanceSnapshot = null;
  }
  listeners.add(onChange);
  onChange();
  return () => {
    listeners.delete(onChange);
    stopIfIdle();
  };
}
