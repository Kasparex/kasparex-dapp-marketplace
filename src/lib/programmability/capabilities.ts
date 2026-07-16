import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import { getWalletProviderInterface } from '@/lib/kaspa/wallet';
import type { CovenantCapabilities } from './types';

function emptyCaps(): CovenantCapabilities {
  return {
    txV1: false,
    covenantBindings: false,
    canSendCovenantTx: false,
    canSignCovenantPskt: false,
    canBroadcastSignedTx: false,
    hasNativeCovenantSubmit: false,
  };
}

function normalizeCaps(raw: Partial<CovenantCapabilities> | null | undefined): CovenantCapabilities {
  const canSign = Boolean(raw?.canSignCovenantPskt);
  const canBroadcast = Boolean(raw?.canBroadcastSignedTx);
  const hasNative = Boolean(raw?.hasNativeCovenantSubmit);
  const txV1 = Boolean(raw?.txV1 ?? (hasNative || canSign));
  const covenantBindings = Boolean(raw?.covenantBindings ?? (hasNative || canSign));
  // Native submit can finish alone. signPskt path needs an unsigned Safe-JSON from Hub/helper.
  const canSend =
    raw?.canSendCovenantTx !== undefined
      ? Boolean(raw.canSendCovenantTx)
      : hasNative || (canSign && canBroadcast);

  return {
    txV1,
    covenantBindings,
    canSendCovenantTx: canSend,
    canSignCovenantPskt: canSign,
    canBroadcastSignedTx: canBroadcast,
    hasNativeCovenantSubmit: hasNative,
  };
}

function readProviderCovenantFlags(provider: unknown): Partial<CovenantCapabilities> {
  if (!provider || typeof provider !== 'object') return {};
  const p = provider as Record<string, unknown>;
  const flags: Partial<CovenantCapabilities> = {};
  if (p.txV1 === true || p.supportsTxV1 === true) flags.txV1 = true;
  if (p.covenantBindings === true || p.supportsCovenants === true) flags.covenantBindings = true;
  return flags;
}

/**
 * Detect whether the connected wallet can build/sign covenant (tx v1) transactions.
 *
 * Primary path (KasCoven / KIP-12): `signPskt` + broadcast of a Hub-built Safe-JSON tx.
 * Optional fast path: wallet-native `sendCovenantTransaction`.
 */
export async function getCovenantCapabilities(
  providerId: KaspaWalletProvider
): Promise<CovenantCapabilities> {
  const wallet = getWalletProviderInterface(providerId);
  if (!wallet) return emptyCaps();

  if (typeof wallet.getCovenantCapabilities === 'function') {
    try {
      const caps = await wallet.getCovenantCapabilities();
      return normalizeCaps(caps);
    } catch {
      // fall through to method sniffing
    }
  }

  const hasNative = typeof wallet.sendCovenantTransaction === 'function';
  const canSign = typeof wallet.signPskt === 'function';
  const canBroadcast = typeof wallet.pushTx === 'function';
  const flags = readProviderCovenantFlags(wallet);

  return normalizeCaps({
    ...flags,
    hasNativeCovenantSubmit: hasNative,
    canSignCovenantPskt: canSign,
    canBroadcastSignedTx: canBroadcast,
    // Hub ships an unsigned Safe-JSON builder (WASM) for deploy; signPskt+pushTx completes it.
    canSendCovenantTx: hasNative || (canSign && canBroadcast),
    txV1: flags.txV1 ?? (hasNative || canSign),
    covenantBindings: flags.covenantBindings ?? (hasNative || canSign),
  });
}

export async function isCovenantWalletReady(providerId: KaspaWalletProvider): Promise<boolean> {
  const caps = await getCovenantCapabilities(providerId);
  return caps.canSendCovenantTx || Boolean(caps.canSignCovenantPskt && caps.canBroadcastSignedTx);
}
