'use client';

type BridgeMessage =
  | { type: 'KASPX_BRIDGE_GET'; requestId: string }
  | { type: 'KASPX_BRIDGE_SET'; requestId: string; items: Record<string, string | null> }
  | { type: 'KASPX_BRIDGE_CLEAR'; requestId: string };

type BridgeResponse =
  | { type: 'KASPX_BRIDGE_GET_RESULT'; requestId: string; items: Record<string, string | null> }
  | { type: 'KASPX_BRIDGE_SET_RESULT'; requestId: string; ok: boolean }
  | { type: 'KASPX_BRIDGE_CLEAR_RESULT'; requestId: string; ok: boolean };

function isAllowedOrigin(origin: string): boolean {
  try {
    const { hostname } = new URL(origin);
    const h = hostname.toLowerCase();
    return h === 'kasparex.com' || h.endsWith('.kasparex.com');
  } catch {
    return false;
  }
}

function shouldSyncKey(key: string): boolean {
  // WalletConnect v2, wagmi, RainbowKit, and a few related caches.
  // Keep it broad enough to cover real sessions, but not everything in storage.
  return (
    key.startsWith('wc@2:') ||
    key.startsWith('walletconnect') ||
    key.startsWith('wagmi') ||
    key.startsWith('rk-') ||
    key.startsWith('@w3m') ||
    key.startsWith('WEB3_CONNECT') ||
    key.startsWith('kaspa_wallet_state') ||
    key.startsWith('kaspa_siwk_auth')
  );
}

export default function WalletBridgePage() {
  // This page is intended to be embedded as a hidden iframe on other kasparex.com subdomains.
  // It acts as a cross-origin storage relay via postMessage.
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    window.addEventListener('message', (event: MessageEvent) => {
      if (!isAllowedOrigin(event.origin)) return;
      const data = event.data as BridgeMessage | undefined;
      if (!data || typeof data !== 'object' || typeof (data as any).type !== 'string') return;
      if (!event.source || typeof (event.source as Window).postMessage !== 'function') return;

      const reply = (payload: BridgeResponse) => {
        (event.source as Window).postMessage(payload, event.origin);
      };

      try {
        if (data.type === 'KASPX_BRIDGE_GET') {
          const items: Record<string, string | null> = {};
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (!k) continue;
            if (!shouldSyncKey(k)) continue;
            items[k] = localStorage.getItem(k);
          }
          reply({ type: 'KASPX_BRIDGE_GET_RESULT', requestId: data.requestId, items });
          return;
        }

        if (data.type === 'KASPX_BRIDGE_SET') {
          for (const [k, v] of Object.entries(data.items ?? {})) {
            if (!shouldSyncKey(k)) continue;
            if (v == null) localStorage.removeItem(k);
            else localStorage.setItem(k, v);
          }
          reply({ type: 'KASPX_BRIDGE_SET_RESULT', requestId: data.requestId, ok: true });
          return;
        }

        if (data.type === 'KASPX_BRIDGE_CLEAR') {
          const keys: string[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (!k) continue;
            if (shouldSyncKey(k)) keys.push(k);
          }
          for (const k of keys) localStorage.removeItem(k);
          reply({ type: 'KASPX_BRIDGE_CLEAR_RESULT', requestId: data.requestId, ok: true });
          return;
        }
      } catch {
        // best-effort relay; no crash
      }
    });
  }

  return (
    <main className="p-4 text-xs text-zinc-500">
      Wallet bridge ready.
    </main>
  );
}

