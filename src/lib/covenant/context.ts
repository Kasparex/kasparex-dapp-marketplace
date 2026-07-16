import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import {
  resolveCovenantNetworkId,
  type ProgrammableNetworkId,
} from '@/lib/programmable/config';

/** Wallet context passed from hooks into covenant runtimes. */
export interface CovenantWalletContext {
  provider: KaspaWalletProvider;
  userAddress: string;
  /** When set, used for WASM createTransactions / indexer. Prefer deriving from address. */
  networkId?: ProgrammableNetworkId;
}

export function requireCovenantContext(
  ctx: CovenantWalletContext | undefined
): CovenantWalletContext {
  if (!ctx?.provider || !ctx.userAddress?.trim()) {
    throw new Error('Connect your Kaspa wallet first');
  }
  return ctx;
}

/** Network id aligned with the connected wallet address (kaspa: → mainnet). */
export function covenantNetworkIdFromContext(
  ctx: CovenantWalletContext,
): ProgrammableNetworkId {
  return resolveCovenantNetworkId({
    address: ctx.userAddress,
    networkId: ctx.networkId,
  });
}

