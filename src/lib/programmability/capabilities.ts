import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import { getWalletProviderInterface } from '@/lib/kaspa/wallet';
import type { CovenantCapabilities } from './types';

function readProviderCovenantFlags(provider: unknown): Partial<CovenantCapabilities> {
  if (!provider || typeof provider !== 'object') return {};
  const p = provider as Record<string, unknown>;
  const caps = p.getCovenantCapabilities;
  if (typeof caps === 'function') {
    return {};
  }
  if (p.txV1 === true || p.supportsTxV1 === true) {
    return { txV1: true };
  }
  if (p.covenantBindings === true || p.supportsCovenants === true) {
    return { covenantBindings: true };
  }
  return {};
}

/**
 * Detect whether the connected wallet can build/sign covenant (tx v1) transactions.
 */
export async function getCovenantCapabilities(
  providerId: KaspaWalletProvider
): Promise<CovenantCapabilities> {
  const wallet = getWalletProviderInterface(providerId);
  if (!wallet) {
    return { txV1: false, covenantBindings: false, canSendCovenantTx: false };
  }

  if (typeof wallet.getCovenantCapabilities === 'function') {
    try {
      const caps = await wallet.getCovenantCapabilities();
      return {
        txV1: Boolean(caps.txV1),
        covenantBindings: Boolean(caps.covenantBindings),
        canSendCovenantTx: Boolean(caps.txV1 && caps.covenantBindings),
      };
    } catch {
      // fall through
    }
  }

  const canSend = typeof wallet.sendCovenantTransaction === 'function';
  const flags = readProviderCovenantFlags(wallet);
  const txV1 = flags.txV1 ?? canSend;
  const covenantBindings = flags.covenantBindings ?? canSend;

  return {
    txV1,
    covenantBindings,
    canSendCovenantTx: canSend || (txV1 && covenantBindings),
  };
}

export async function isCovenantWalletReady(providerId: KaspaWalletProvider): Promise<boolean> {
  const caps = await getCovenantCapabilities(providerId);
  return caps.canSendCovenantTx;
}
