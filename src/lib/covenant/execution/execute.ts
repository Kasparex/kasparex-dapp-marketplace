/**
 * High-level covenant deploy/spend for silverscript runtimes.
 */

import type { ProgrammableNetworkId } from '@/lib/programmable/config';
import { CovenantNotReadyError } from '@/lib/programmability/errors';
import { readCovenantIdField } from '@/lib/kaspa/api';
import { verifyCovenantTransaction } from '@/lib/programmability/verify';
import type { CovenantTemplate, CovenantTxResult } from '@/lib/programmability/types';
import { covenantNetworkIdFromContext, type CovenantWalletContext } from '../context';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import { awaitCovenantSettlement } from './await-settlement';
import { loadKaspaComCompiledContract } from './artifacts';
import { createWalletCovenantProvider } from './wallet-provider';
import { KPX_COVENANT_PAYLOAD_TEMPLATES } from './payload-claim';
import type { CovenantDeployRequest, CovenantSpendRequest } from './types';

function networkIdFromContext(ctx: CovenantWalletContext): ProgrammableNetworkId {
  return covenantNetworkIdFromContext(ctx);
}

async function enrichCovenantId(result: CovenantTxResult): Promise<CovenantTxResult> {
  if (result.covenantId || !result.txHash) return result;
  const tx = await verifyCovenantTransaction(result.txHash);
  const firstOut = tx?.outputs?.[0] as Record<string, unknown> | undefined;
  const covenantId = readCovenantIdField(firstOut ?? null);
  return covenantId ? { ...result, covenantId } : result;
}

async function runWithSettlement(
  txHash: string,
  networkId: ProgrammableNetworkId,
  base: CovenantTxResult,
): Promise<CovenantTxResult> {
  if (!txHash) return base;
  const settlement = await awaitCovenantSettlement(txHash, networkId, { maxAttempts: 4, delayMs: 1200 });
  if (!settlement.indexed) return base;
  return { ...base, status: base.status === 'failed' ? 'failed' : 'confirmed' };
}

export async function executeCovenantDeploy(
  ctx: CovenantWalletContext,
  request: CovenantDeployRequest,
): Promise<CovenantTxResult> {
  const provider = createWalletCovenantProvider(ctx.provider as KaspaWalletProvider);
  if (!(await provider.canExecute())) {
    throw new CovenantNotReadyError(
      'Your wallet does not support Kaspa covenant transactions yet. Connect a wallet with signPskt + pushTx (KasCoven / KIP-12 path).',
    );
  }

  const compiled = await loadKaspaComCompiledContract(request.template);
  // Always align with wallet address prefix (overrides stale testnet defaults).
  const networkId = networkIdFromContext(ctx);
  const executed = await provider.deploy({ ...request, networkId }, compiled);

  if (executed.status === 'failed' || !executed.txHash) {
    throw new Error(executed.error || 'Covenant deploy failed');
  }

  let result: CovenantTxResult = {
    txHash: executed.txHash,
    status: executed.status,
    covenantId: executed.covenantId,
    outpoint: executed.outpoint
      ? { txId: executed.outpoint.txid, index: executed.outpoint.vout }
      : undefined,
  };

  result = await enrichCovenantId(result);
  result = await runWithSettlement(executed.txHash, networkId, result);
  return result;
}

export async function executeCovenantSpend(
  ctx: CovenantWalletContext,
  request: CovenantSpendRequest,
): Promise<CovenantTxResult> {
  const provider = createWalletCovenantProvider(ctx.provider as KaspaWalletProvider);
  if (!(await provider.canExecute())) {
    throw new CovenantNotReadyError(
      'Your wallet does not support Kaspa covenant spends yet. Connect a wallet with signPskt + pushTx (KasCoven / KIP-12 path).',
    );
  }

  const compiled = await loadKaspaComCompiledContract(request.template);
  const networkId = networkIdFromContext(ctx);
  const executed = await provider.spend({ ...request, networkId }, compiled);

  if (executed.status === 'failed' || !executed.txHash) {
    throw new Error(executed.error || 'Covenant spend failed');
  }

  let result: CovenantTxResult = {
    txHash: executed.txHash,
    status: executed.status,
    covenantId: executed.covenantId,
  };

  result = await enrichCovenantId(result);
  result = await runWithSettlement(executed.txHash, networkId, result);
  return result;
}

/** @deprecated Prefer executeCovenantDeploy / executeCovenantSpend */
export async function executeLegacyTemplateTx(
  ctx: CovenantWalletContext,
  template: CovenantTemplate,
  params: Record<string, unknown>,
  spendOutpoint?: { txId: string; index: number },
): Promise<CovenantTxResult> {
  const isSpend = params.action === 'claim' || params.action === 'spend' || params.action === 'redeem' || params.action === 'refund' || Boolean(spendOutpoint);
  if (isSpend) {
    if (!spendOutpoint) {
      throw new Error(
        `${template} spend requires a covenant UTXO outpoint. Use executeCovenantSpend via shared l1 helpers.`,
      );
    }
    return executeCovenantSpend(ctx, {
      template,
      networkId: networkIdFromContext(ctx),
      functionName: String(params.functionName ?? 'claim'),
      spendOutpoint: { txid: spendOutpoint.txId, vout: spendOutpoint.index },
      inputAmountSompi: String(params.amountSompi ?? params.inputAmountSompi ?? '0'),
      outputs: Array.isArray(params.outputs)
        ? (params.outputs as Array<{ address: string; amountSompi: string }>)
        : [
            {
              address: String(params.beneficiary ?? ctx.userAddress),
              amountSompi: String(params.amountSompi ?? '0'),
            },
          ],
      params,
    });
  }

  return executeCovenantDeploy(ctx, {
    template,
    amountSompi: String(params.amountSompi ?? '0'),
    networkId: networkIdFromContext(ctx),
    payloadTemplate: String(params.payloadTemplate ?? KPX_COVENANT_PAYLOAD_TEMPLATES[template]),
    payloadArgs: Array.isArray(params.payloadArgs) ? params.payloadArgs : undefined,
    params,
  });
}
