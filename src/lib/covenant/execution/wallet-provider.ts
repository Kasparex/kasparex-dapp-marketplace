/**
 * Wallet covenant execution adapter (KaspaCom SDK shape, Hub-safe).
 * Delegates signing to KasWare / Kastle when sendCovenantTransaction is available.
 */

import { submitCovenantTransaction } from '@/lib/programmability/tx-builder';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import type {
  CovenantDeployRequest,
  CovenantExecutionProvider,
  CovenantExecutionResult,
  CovenantSpendRequest,
  KaspaComCompiledContract,
} from './types';
import { buildDeployPayloadHex } from './payload-claim';

function mapWalletResult(
  result: Awaited<ReturnType<typeof submitCovenantTransaction>>,
): CovenantExecutionResult {
  return {
    txHash: result.txHash,
    status: result.status,
    covenantId: result.covenantId,
    outpoint: result.outpoint
      ? { txid: result.outpoint.txId, vout: result.outpoint.index }
      : undefined,
    error: result.error,
  };
}

export function createWalletCovenantProvider(
  provider: KaspaWalletProvider,
): CovenantExecutionProvider {
  return {
    id: 'wallet',
    async canExecute() {
      const { getCovenantCapabilities } = await import('@/lib/programmability/capabilities');
      const caps = await getCovenantCapabilities(provider);
      return caps.canSendCovenantTx;
    },
    async deploy(request, compiled) {
      const payloadHex = buildDeployPayloadHex({
        networkId: request.networkId,
        template: request.payloadTemplate,
        args: request.payloadArgs,
        meta: request.payloadMeta,
      });

      const result = await submitCovenantTransaction(provider, {
        template: request.template,
        kind: 'deploy',
        params: {
          ...request.params,
          amountSompi: request.amountSompi,
          networkId: request.networkId,
          payloadTemplate: request.payloadTemplate,
        },
        compiled,
        transactionPayloadHex: payloadHex,
        computeBudget: 10,
      });
      return mapWalletResult(result);
    },
    async spend(request, compiled) {
      const result = await submitCovenantTransaction(provider, {
        template: request.template,
        kind: 'spend',
        functionName: request.functionName,
        params: {
          ...request.params,
          inputAmountSompi: request.inputAmountSompi,
          outputs: request.outputs,
          extraArgs: request.extraArgs,
          networkId: request.networkId,
        },
        spendOutpoint: {
          txId: request.spendOutpoint.txid,
          index: request.spendOutpoint.vout,
        },
        compiled,
        computeBudget: 10,
      });
      return mapWalletResult(result);
    },
  };
}
