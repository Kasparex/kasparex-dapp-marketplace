'use client';

import { disconnect } from '@wagmi/core';
import { config } from '@/lib/wagmi';

/** Clears the active wagmi / RainbowKit EVM session (no-op if already disconnected). */
export async function disconnectWagmiWallet(): Promise<void> {
  try {
    await disconnect(config);
  } catch {
    // Not connected or connector already torn down
  }
}
