'use client';

import { disconnect, getConnections } from '@wagmi/core';
import { config } from '@/lib/wagmi';

/**
 * Persist "disconnected" shims for every configured connector so injected providers
 * (e.g. KasWare's shared `window.ethereum`) cannot immediately re-attach via
 * `accountsChanged` after we disconnect — wagmi otherwise clears the shim on that path.
 */
async function persistInjectedDisconnectShims(): Promise<void> {
  const storage = config.storage;
  if (!storage) return;
  const s = storage as {
    setItem: (key: string, value: unknown) => void | Promise<void>;
    removeItem: (key: string) => void | Promise<void>;
  };
  for (const connector of config.connectors) {
    await s.setItem(`${connector.id}.disconnected`, true);
  }
  await s.removeItem('injected.connected');
}

async function disconnectAllConnections(): Promise<void> {
  let list = getConnections(config);
  let guard = 0;
  while (list.length > 0 && guard < 32) {
    guard += 1;
    const prevSize = list.length;
    await disconnect(config, { connector: list[0].connector });
    list = getConnections(config);
    if (list.length >= prevSize) break;
  }
}

/** True if any wagmi connection is active (WalletConnect, MetaMask, injected, etc.). */
export function wagmiHasActiveConnections(): boolean {
  try {
    return getConnections(config).length > 0;
  } catch {
    return false;
  }
}

/** Clears wagmi / RainbowKit EVM sessions and blocks instant reinject reconnect. */
export async function disconnectWagmiWallet(): Promise<void> {
  try {
    await disconnectAllConnections();
  } catch {
    // Not connected or connector already torn down
  }
  try {
    await persistInjectedDisconnectShims();
  } catch {
    // Storage unavailable
  }
}

/**
 * After Kaspa L1 account switches, wagmi may reconnect on the same EIP-1193 provider.
 * Run disconnect a few times across task boundaries so it wins the race.
 */
export function scheduleDisconnectWagmiWalletBursts(): void {
  const run = () => {
    void disconnectWagmiWallet();
  };
  run();
  queueMicrotask(run);
  setTimeout(run, 0);
  setTimeout(run, 32);
  setTimeout(run, 120);
}
