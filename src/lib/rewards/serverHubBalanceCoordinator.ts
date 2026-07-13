/**
 * Single shared poller for server pts balance so every
 * useRedeemablePointsBreakdown() consumer does not spawn its own interval.
 */

const POLL_MS = 300_000;

type Listener = () => void;

const listeners = new Set<Listener>();

let currentAddr = '';
let balanceSnapshot: number | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let fetchGeneration = 0;
let visibilityListenerAttached = false;

function notify() {
  for (const cb of listeners) cb();
}

function isDocumentVisible(): boolean {
  if (typeof document === 'undefined') return true;
  return document.visibilityState === 'visible';
}

function balanceUrl(addr: string): string {
  return `/api/kasparex-worker/kasparex/pts/balance?wallet=${encodeURIComponent(addr)}`;
}

async function fetchOnce(addr: string, gen: number) {
  try {
    const r = await fetch(balanceUrl(addr), { cache: 'default' });
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

function clearPollTimer() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

function startPollLoop() {
  clearPollTimer();
  if (!currentAddr || !isDocumentVisible()) return;
  pollTimer = setInterval(() => {
    if (!isDocumentVisible()) {
      clearPollTimer();
      return;
    }
    fetchGeneration++;
    void fetchOnce(currentAddr, fetchGeneration);
  }, POLL_MS);
}

function ensureVisibilityListener() {
  if (visibilityListenerAttached || typeof document === 'undefined') return;
  visibilityListenerAttached = true;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      refreshServerHubBalance();
      startPollLoop();
    } else {
      clearPollTimer();
    }
  });
}

function restartPolling(addr: string) {
  clearPollTimer();
  currentAddr = addr;
  balanceSnapshot = null;
  fetchGeneration++;
  const gen = fetchGeneration;
  ensureVisibilityListener();
  void fetchOnce(addr, gen);
  startPollLoop();
}

function stopIfIdle() {
  if (listeners.size > 0) return;
  clearPollTimer();
  currentAddr = '';
  balanceSnapshot = null;
}

export function getServerHubBalanceForAddr(addr: string): number | null {
  if (!addr || addr !== currentAddr) return null;
  return balanceSnapshot;
}

/** Immediate refetch (same wallet). Safe to call from hub-ledger / minecore events. */
export function refreshServerHubBalance() {
  if (!currentAddr || !isDocumentVisible()) return;
  fetchGeneration++;
  void fetchOnce(currentAddr, fetchGeneration);
}

export function subscribeServerHubBalance(addr: string, onChange: Listener): () => void {
  const empty = !addr.trim();
  if (!empty && addr !== currentAddr) {
    restartPolling(addr);
  } else if (empty) {
    clearPollTimer();
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
