/**
 * signPskt-first covenant submit (KasCoven / KIP-12 pattern).
 *
 * Flow proven on https://vaults.kaslab.space/ :
 * 1. dApp/helper builds unsigned Safe-JSON tx
 * 2. wallet.signPskt signs only the listed user inputs
 * 3. wallet.pushTx (or equivalent) broadcasts the signed tx
 */

import { formatKaspaWalletError } from './formatWalletError';
import { extractKaspaTransactionId } from './transactionId';
import type { CovenantSignInput, CovenantTxResult } from '@/lib/programmability/types';
import type { KaspaWalletProvider } from './types';
import { getWalletProvider } from './wallet';

const SIGHASH_ALL = 1;

export interface SignAndBroadcastCovenantPsktArgs {
  unsignedTxJson: string;
  signInputs?: CovenantSignInput[];
  /** When true (default), ask KasWare-style wallets not to finalize/mutate covenant scripts. */
  autoFinalize?: boolean;
}

function buildSignOptions(
  signInputs: CovenantSignInput[] | undefined,
  autoFinalize: boolean
): Record<string, unknown> {
  const inputs = signInputs?.length
    ? signInputs
    : [{ index: 0, sighashType: SIGHASH_ALL }];

  const signInputsPayload = inputs.map((i) => ({
    index: i.index,
    sighashType: i.sighashType ?? SIGHASH_ALL,
  }));

  const toSignInputs = inputs.map((i) => ({
    index: i.index,
    ...(i.address ? { address: i.address } : {}),
    ...(i.publicKey ? { publicKey: i.publicKey } : {}),
  }));

  return {
    signInputs: signInputsPayload,
    toSignInputs,
    autoFinalize,
    autoFinalized: autoFinalize,
  };
}

/**
 * Sign selected inputs of an unsigned Safe-JSON tx, then broadcast.
 */
export async function signAndBroadcastCovenantPskt(
  provider: KaspaWalletProvider,
  args: SignAndBroadcastCovenantPsktArgs
): Promise<CovenantTxResult> {
  const wallet = getWalletProvider(provider);
  if (!wallet?.signPskt) {
    return {
      txHash: '',
      status: 'failed',
      error:
        'Wallet does not expose signPskt. Update KasWare / Kastle, or use a Toccata-ready wallet.',
    };
  }
  if (!wallet.pushTx) {
    return {
      txHash: '',
      status: 'failed',
      error:
        'Wallet does not expose pushTx (broadcast). Update KasWare / Kastle to broadcast signed covenant txs.',
    };
  }

  const unsigned = args.unsignedTxJson?.trim();
  if (!unsigned) {
    return {
      txHash: '',
      status: 'failed',
      error: 'Missing unsigned Safe-JSON transaction for signPskt.',
    };
  }

  try {
    const options = buildSignOptions(args.signInputs, args.autoFinalize ?? false);
    const signedTxJson = await wallet.signPskt(unsigned, options);
    if (typeof signedTxJson !== 'string' || !signedTxJson.trim()) {
      return {
        txHash: '',
        status: 'failed',
        error: 'Wallet signPskt returned an empty result',
      };
    }

    const broadcastRaw = await wallet.pushTx(signedTxJson);
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

    return { txHash, status: 'pending' };
  } catch (error) {
    return {
      txHash: '',
      status: 'failed',
      error: formatKaspaWalletError(error),
    };
  }
}

/**
 * Resolve unsigned Safe-JSON from a covenant request (top-level or params).
 */
export function resolveUnsignedTxJson(request: {
  unsignedTxJson?: string;
  params?: Record<string, unknown>;
}): string | null {
  if (typeof request.unsignedTxJson === 'string' && request.unsignedTxJson.trim()) {
    return request.unsignedTxJson.trim();
  }
  const p = request.params;
  if (!p) return null;
  for (const key of ['unsignedTxJson', 'txJson', 'txJsonString'] as const) {
    const v = p[key];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return null;
}

export function resolveSignInputs(request: {
  signInputs?: CovenantSignInput[];
  params?: Record<string, unknown>;
}): CovenantSignInput[] | undefined {
  if (Array.isArray(request.signInputs) && request.signInputs.length > 0) {
    return request.signInputs;
  }
  const raw = request.params?.signInputs ?? request.params?.toSignInputs;
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const o = item as Record<string, unknown>;
      const index = Number(o.index ?? o.inputIndex);
      if (!Number.isFinite(index) || index < 0) return null;
      return {
        index,
        sighashType: typeof o.sighashType === 'number' ? o.sighashType : undefined,
        address: typeof o.address === 'string' ? o.address : undefined,
        publicKey:
          typeof o.publicKey === 'string'
            ? o.publicKey
            : typeof o.pubkey === 'string'
              ? o.pubkey
              : undefined,
      } satisfies CovenantSignInput;
    })
    .filter((x): x is CovenantSignInput => x !== null);
}
