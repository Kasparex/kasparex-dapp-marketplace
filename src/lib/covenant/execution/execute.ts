/**
 * High-level covenant deploy/spend for silverscript runtimes.
 */

import { DEFAULT_PROGRAMMABLE_NETWORK } from '@/lib/programmable/config';
import { CovenantNotReadyError } from '@/lib/programmability/errors';
import { readCovenantIdField } from '@/lib/kaspa/api';
import { verifyCovenantTransaction } from '@/lib/programmability/verify';
import type { CovenantTemplate, CovenantTxResult } from '@/lib/programmability/types';
import type { CovenantWalletContext } from '../context';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import { awaitCovenantSettlement } from './await-settlement';
import { loadKaspaComCompiledContract } from './artifacts';
import { createWalletCovenantProvider } from './wallet-provider';
import { KPX_COVENANT_PAYLOAD_TEMPLATES } from './payload-claim';
import type { CovenantDeployRequest, CovenantSpendRequest } from './types';

function networkIdFromContext(ctx: CovenantWalletContext): typeof DEFAULT_PROGRAMMABLE_NETWORK {
  return (ctx as { networkId?: typeof DEFAULT_PROGRAMMABLE_NETWORK }).networkId ?? DEFAULT_PROGRAMMABLE_NETWORK;
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
  networkId: typeof DEFAULT_PROGRAMMABLE_NETWORK,
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
      'Your wallet does not support Kaspa covenant transactions yet. Hybrid mode will use the local simulator until KasWare, Kastle, or KaspaCom wallet expose covenant deploy.',
    );
  }

  const compiled = await loadKaspaComCompiledContract(request.template);
  const networkId = request.networkId ?? networkIdFromContext(ctx);
  const executed = await provider.deploy(request, compiled);

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
      'Your wallet does not support Kaspa covenant spends yet. Use simulator mode or connect a Toccata-ready wallet later.',
    );
  }

  const compiled = await loadKaspaComCompiledContract(request.template);
  const networkId = request.networkId ?? networkIdFromContext(ctx);
  const executed = await provider.spend(request, compiled);

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
  const isSpend = params.action === 'claim' || params.action === 'spend' || Boolean(spendOutpoint);
  if (isSpend && spendOutpoint) {
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
