type BridgeGetResponse = {
  type: 'KASPX_BRIDGE_GET_RESULT';
  requestId: string;
  items: Record<string, string | null>;
};

type BridgeSetResponse = {
  type: 'KASPX_BRIDGE_SET_RESULT';
  requestId: string;
  ok: boolean;
};

function isKasparexHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return h === 'kasparex.com' || h.endsWith('.kasparex.com');
}

function bridgeUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const { hostname, protocol } = window.location;
  if (!isKasparexHost(hostname)) return null;
  return `${protocol}//hub.kasparex.com/wallet-bridge`;
}

function shouldSyncKey(key: string): boolean {
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

function createHiddenIframe(src: string): HTMLIFrameElement {
  const iframe = document.createElement('iframe');
  iframe.src = src;
  iframe.setAttribute('title', 'Kasparex wallet bridge');
  iframe.style.position = 'fixed';
  iframe.style.left = '-9999px';
  iframe.style.top = '0';
  iframe.style.width = '1px';
  iframe.style.height = '1px';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  iframe.style.border = '0';
  return iframe;
}

function requestId(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function syncFromHubWalletBridge(opts?: { timeoutMs?: number }): Promise<{ applied: boolean }> {
  if (typeof window === 'undefined' || typeof document === 'undefined') return { applied: false };
  const src = bridgeUrl();
  if (!src) return { applied: false };

  // Avoid infinite reload loops.
  const guardKey = 'kaspx_wallet_bridge_last_sync_ms';
  const last = Number(localStorage.getItem(guardKey) ?? '0');
  const now = Date.now();
  if (now - last < 5_000) return { applied: false };
  localStorage.setItem(guardKey, String(now));

  const timeoutMs = opts?.timeoutMs ?? 2_500;
  const iframe = createHiddenIframe(src);
  document.body.appendChild(iframe);

  const hubOrigin = new URL(src).origin;
  const reqId = requestId();

  const result = await new Promise<{ items: Record<string, string | null> } | null>((resolve) => {
    const timer = window.setTimeout(() => resolve(null), timeoutMs);

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== hubOrigin) return;
      const data = event.data as BridgeGetResponse | BridgeSetResponse | undefined;
      if (!data || typeof data !== 'object') return;
      if ((data as any).requestId !== reqId) return;
      if ((data as any).type !== 'KASPX_BRIDGE_GET_RESULT') return;

      window.clearTimeout(timer);
      window.removeEventListener('message', onMessage);
      resolve({ items: (data as BridgeGetResponse).items ?? {} });
    };

    window.addEventListener('message', onMessage);

    const tryPost = () => {
      try {
        iframe.contentWindow?.postMessage({ type: 'KASPX_BRIDGE_GET', requestId: reqId }, hubOrigin);
      } catch {
        // ignore
      }
    };

    // Post on load; also one immediate attempt (some browsers load super fast).
    iframe.addEventListener('load', tryPost, { once: true });
    tryPost();
  });

  iframe.remove();
  if (!result) return { applied: false };

  let applied = false;
  for (const [k, v] of Object.entries(result.items)) {
    if (!shouldSyncKey(k)) continue;
    const current = localStorage.getItem(k);
    if (v == null) {
      if (current != null) {
        localStorage.removeItem(k);
        applied = true;
      }
    } else {
      if (current !== v) {
        localStorage.setItem(k, v);
        applied = true;
      }
    }
  }

  // If we applied changes, reload so wagmi/walletconnect boot with the synced store.
  if (applied) {
    sessionStorage.setItem('kaspx_wallet_bridge_applied', '1');
  }

  return { applied };
}

export async function pushToHubWalletBridge(items: Record<string, string | null>, opts?: { timeoutMs?: number }) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const src = bridgeUrl();
  if (!src) return;
  const hubOrigin = new URL(src).origin;
  const timeoutMs = opts?.timeoutMs ?? 2_500;

  const filtered: Record<string, string | null> = {};
  for (const [k, v] of Object.entries(items)) {
    if (shouldSyncKey(k)) filtered[k] = v;
  }

  const iframe = createHiddenIframe(src);
  document.body.appendChild(iframe);

  const reqId = requestId();
  await new Promise<void>((resolve) => {
    const timer = window.setTimeout(() => resolve(), timeoutMs);
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== hubOrigin) return;
      const data = event.data as BridgeSetResponse | undefined;
      if (!data || typeof data !== 'object') return;
      if (data.type !== 'KASPX_BRIDGE_SET_RESULT') return;
      if (data.requestId !== reqId) return;
      window.clearTimeout(timer);
      window.removeEventListener('message', onMessage);
      resolve();
    };
    window.addEventListener('message', onMessage);

    const tryPost = () => {
      try {
        iframe.contentWindow?.postMessage({ type: 'KASPX_BRIDGE_SET', requestId: reqId, items: filtered }, hubOrigin);
      } catch {
        // ignore
      }
    };
    iframe.addEventListener('load', tryPost, { once: true });
    tryPost();
  });

  iframe.remove();
}

