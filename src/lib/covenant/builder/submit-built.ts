import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import { getWalletProvider } from '@/lib/kaspa/wallet';
import {
  signAndBroadcastCovenantPskt,
} from '@/lib/kaspa/pskt-covenant';
import type { CovenantTxResult } from '@/lib/programmability/types';
import type { UnsignedCovenantTx } from './types';
import { finalizeSpendAuthSignatureScript } from './spend';
import { CovenantNotReadyError } from '@/lib/programmability/errors';

const SIGHASH_ALL = 1;

/**
 * Sign+broadcast prerequisite consolidation txs, then the primary covenant tx.
 * Spend/claim: sign redeem on input 0 → ABI-wrap → sign fee inputs → pushTx.
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

  if (built.spendAuth) {
    return signAndBroadcastSpendWithAuth(provider, built);
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

async function signAndBroadcastSpendWithAuth(
  provider: KaspaWalletProvider,
  built: UnsignedCovenantTx,
): Promise<CovenantTxResult> {
  const spendAuth = built.spendAuth!;
  const wallet = getWalletProvider(provider);
  if (!wallet?.signPskt || !wallet.pushTx) {
    return {
      txHash: '',
      status: 'failed',
      error:
        'Wallet does not expose signPskt + pushTx required for covenant claim/spend.',
    };
  }

  const publicKeyHex =
    (await resolvePublicKeyHex(provider)) ||
    built.signInputs.find((i) => i.publicKey)?.publicKey ||
    null;
  if (!publicKeyHex) {
    throw new CovenantNotReadyError(
      'Wallet public key is required to finalize the claim ABI sigscript (getPublicKey).',
    );
  }

  const senderAddress = await resolveSenderAddress(provider);
  const covenantIndex = spendAuth.covenantInputIndex;

  // Phase 1: wallet signs covenant input using redeem script as scriptCode.
  let afterRedeemSign: string;
  try {
    afterRedeemSign = await wallet.signPskt(built.unsignedTxJson, {
      toSignInputs: [
        {
          index: covenantIndex,
          address: senderAddress,
          publicKey: publicKeyHex,
        },
      ],
      signInputs: [{ index: covenantIndex, sighashType: SIGHASH_ALL }],
      scripts: [
        {
          inputIndex: covenantIndex,
          scriptHex: spendAuth.redeemScriptHex,
        },
      ],
      autoFinalize: false,
      autoFinalized: false,
    });
  } catch (err) {
    throw new CovenantNotReadyError(
      `Wallet could not sign the covenant redeem input: ${
        err instanceof Error ? err.message : String(err)
      }. KasWare/Kastle must support signPskt with a scripts/redeem option for claim.`,
    );
  }

  if (typeof afterRedeemSign !== 'string' || !afterRedeemSign.trim()) {
    throw new CovenantNotReadyError(
      'Wallet signPskt returned an empty result when signing the covenant redeem input.',
    );
  }

  let withAbiUnlock: string;
  try {
    withAbiUnlock = await finalizeSpendAuthSignatureScript(
      afterRedeemSign,
      spendAuth,
      publicKeyHex,
    );
  } catch (err) {
    throw new CovenantNotReadyError(
      err instanceof Error ? err.message : String(err),
    );
  }

  // Phase 2: sign fee inputs only (leave covenant ABI unlock untouched).
  if (built.signInputs.length > 0) {
    const feeSigned = await signAndBroadcastCovenantPskt(provider, {
      unsignedTxJson: withAbiUnlock,
      signInputs: built.signInputs,
      autoFinalize: false,
      skipBroadcast: true,
    });
    if (feeSigned.status === 'failed' || !feeSigned.signedTxJson) {
      return {
        txHash: '',
        status: 'failed',
        error: feeSigned.error || 'Failed to sign fee inputs for covenant spend',
      };
    }
    withAbiUnlock = feeSigned.signedTxJson;
  }

  const { extractKaspaTransactionId } = await import('@/lib/kaspa/transactionId');
  const { formatKaspaWalletError } = await import('@/lib/kaspa/formatWalletError');
  try {
    const broadcastRaw = await wallet.pushTx(withAbiUnlock);
    const txHash =
      extractKaspaTransactionId(broadcastRaw) ??
      (typeof broadcastRaw === 'string' ? broadcastRaw : '');
    if (!txHash) {
      return {
        txHash: '',
        status: 'failed',
        error: 'Broadcast succeeded without a recognizable transaction id',
      };
    }
    return {
      txHash,
      status: 'pending',
      covenantId: built.provisionalCovenantId,
      outpoint:
        built.primaryOutputIndex !== undefined
          ? { txId: txHash, index: built.primaryOutputIndex }
          : undefined,
    };
  } catch (error) {
    return {
      txHash: '',
      status: 'failed',
      error: formatKaspaWalletError(error),
    };
  }
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
