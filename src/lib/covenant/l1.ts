/**
 * Shared L1 covenant helpers for all Hub templates.
 * Future dApps should deploy/spend through these helpers (not per-dApp simulators).
 */

import { CovenantNotReadyError } from '@/lib/programmability/errors';
import type { CovenantTemplate } from '@/lib/programmability/types';
import { covenantNetworkIdFromContext, type CovenantWalletContext } from './context';
import {
  executeCovenantDeploy,
  executeCovenantSpend,
  KPX_COVENANT_PAYLOAD_TEMPLATES,
} from './execution';
import { loadKaspaComCompiledContract, resolveSpendFunctionName } from './execution/artifacts';
import type { KaspaComPayloadArg } from './execution/types';
import type { CovenantUtxoRef } from './types';

export type L1DeployResult = {
  txHash: string;
  covenantId: string;
  utxo: CovenantUtxoRef;
};

export type L1SpendResult = {
  txHash: string;
  covenantId?: string;
};

/**
 * Resolve a spendable outpoint from stored fields.
 * Prefer explicit utxo; fall back to lock/funding tx at index 0 (genesis output).
 */
export function resolveCovenantUtxoRef(args: {
  utxo?: CovenantUtxoRef | null;
  lockTxHash?: string | null;
  txHash?: string | null;
}): CovenantUtxoRef | null {
  const fromUtxo = args.utxo?.txId?.trim();
  if (fromUtxo) {
    return {
      txId: fromUtxo,
      index: Number.isFinite(args.utxo?.index) ? Number(args.utxo!.index) : 0,
    };
  }
  const fromTx = (args.lockTxHash ?? args.txHash ?? '').trim();
  if (!fromTx || fromTx.startsWith('sim_') || fromTx.startsWith('pending_')) return null;
  return { txId: fromTx, index: 0 };
}

export function requireCovenantUtxoRef(
  args: {
    utxo?: CovenantUtxoRef | null;
    lockTxHash?: string | null;
    txHash?: string | null;
  },
  label = 'Instance',
): CovenantUtxoRef {
  const resolved = resolveCovenantUtxoRef(args);
  if (!resolved) {
    throw new Error(
      `${label} is missing an on-chain UTXO reference. Create a new lock with a wallet that supports signPskt + pushTx (older local/demo rows cannot be claimed on L1).`,
    );
  }
  return resolved;
}

export async function requireL1CovenantReady<T>(
  productLabel: string,
  run: () => Promise<T>,
): Promise<T> {
  try {
    return await run();
  } catch (err) {
    if (err instanceof CovenantNotReadyError) {
      throw new CovenantNotReadyError(
        `${err.message} Local simulator fallback is disabled for ${productLabel}. Connect a wallet with signPskt + pushTx (KasCoven / KIP-12).`,
      );
    }
    throw err;
  }
}

export async function deployL1CovenantLock(
  ctx: CovenantWalletContext,
  args: {
    template: CovenantTemplate;
    amountSompi: string;
    payloadArgs?: KaspaComPayloadArg[];
    payloadMeta?: Record<string, string>;
    params?: Record<string, unknown>;
  },
): Promise<L1DeployResult> {
  const networkId = covenantNetworkIdFromContext(ctx);
  const tx = await executeCovenantDeploy(ctx, {
    template: args.template,
    amountSompi: args.amountSompi,
    networkId,
    payloadTemplate: KPX_COVENANT_PAYLOAD_TEMPLATES[args.template],
    payloadArgs: args.payloadArgs,
    payloadMeta: args.payloadMeta,
    params: args.params,
  });

  if (!tx.txHash) throw new Error(`${args.template} deploy did not return a transaction id`);

  return {
    txHash: tx.txHash,
    covenantId: tx.covenantId ?? `pending_${tx.txHash.slice(0, 16)}`,
    utxo: tx.outpoint ?? { txId: tx.txHash, index: 0 },
  };
}

export async function spendL1CovenantLock(
  ctx: CovenantWalletContext,
  args: {
    template: CovenantTemplate;
    utxo: CovenantUtxoRef;
    amountSompi: string;
    toAddress: string;
    functionNameFallback?: string;
    params?: Record<string, unknown>;
    extraArgs?: Record<string, string>;
  },
): Promise<L1SpendResult> {
  if (!args.utxo?.txId) {
    throw new Error(`${args.template} instance is missing on-chain UTXO reference`);
  }

  const compiled = await loadKaspaComCompiledContract(args.template);
  const functionName = resolveSpendFunctionName(
    compiled,
    args.functionNameFallback ?? 'claim',
  );

  const tx = await executeCovenantSpend(ctx, {
    template: args.template,
    networkId: covenantNetworkIdFromContext(ctx),
    functionName,
    spendOutpoint: { txid: args.utxo.txId, vout: args.utxo.index },
    inputAmountSompi: args.amountSompi,
    outputs: [{ address: args.toAddress.trim(), amountSompi: args.amountSompi }],
    extraArgs: args.extraArgs,
    params: args.params,
  });

  if (!tx.txHash) throw new Error(`${args.template} spend did not return a transaction id`);

  return { txHash: tx.txHash, covenantId: tx.covenantId };
}
