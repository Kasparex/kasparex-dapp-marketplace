import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import { getWalletProvider } from '@/lib/kaspa/wallet';
import {
  signAndBroadcastCovenantPskt,
} from '@/lib/kaspa/pskt-covenant';
import type { CovenantTxResult } from '@/lib/programmability/types';
import type { UnsignedCovenantTx } from './types';

/**
 * Sign+broadcast prerequisite consolidation txs, then the primary covenant tx.
 */
export async function signAndBroadcastBuiltCovenant(
  provider: KaspaWalletProvider,
  built: UnsignedCovenantTx,
): Promise<CovenantTxResult> {
  for (const pre of built.prerequisiteTxs ?? []) {
    const preResult = await signAndBroadcastCovenantPskt(provider, {
      unsignedTxJson: pre.unsignedTxJson,
      signInputs: pre.signInputs,
      autoFinalize: false,
    });
    if (preResult.status === 'failed' || !preResult.txHash) {
      return {
        txHash: '',
        status: 'failed',
        error: preResult.error || 'Failed to broadcast UTXO consolidation tx before covenant deploy',
      };
    }
  }

  const result = await signAndBroadcastCovenantPskt(provider, {
    unsignedTxJson: built.unsignedTxJson,
    signInputs: built.signInputs,
    autoFinalize: false,
  });

  if (result.status === 'failed') return result;

  return {
    ...result,
    covenantId: built.provisionalCovenantId ?? result.covenantId,
    outpoint:
      result.outpoint ??
      (built.primaryOutputIndex !== undefined
        ? { txId: result.txHash, index: built.primaryOutputIndex }
        : undefined),
  };
}

export async function resolveSenderAddress(
  provider: KaspaWalletProvider,
): Promise<string> {
  const wallet = getWalletProvider(provider);
  const addr = wallet ? await wallet.getAddress() : null;
  if (!addr?.trim()) {
    throw new Error('Connect a Kaspa wallet before building a covenant transaction');
  }
  return addr.trim();
}

export async function resolvePublicKeyHex(
  provider: KaspaWalletProvider,
): Promise<string | null> {
  const wallet = getWalletProvider(provider);
  if (!wallet?.getPublicKey) return null;
  try {
    return await wallet.getPublicKey();
  } catch {
    return null;
  }
}
