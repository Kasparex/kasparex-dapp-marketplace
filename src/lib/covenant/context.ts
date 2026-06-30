import type { KaspaWalletProvider } from '@/lib/kaspa/types';

/** Wallet context passed from hooks into covenant runtimes. */
export interface CovenantWalletContext {
  provider: KaspaWalletProvider;
  userAddress: string;
}

export function requireCovenantContext(
  ctx: CovenantWalletContext | undefined
): CovenantWalletContext {
  if (!ctx?.provider || !ctx.userAddress?.trim()) {
    throw new Error('Connect your Kaspa wallet first');
  }
  return ctx;
}
