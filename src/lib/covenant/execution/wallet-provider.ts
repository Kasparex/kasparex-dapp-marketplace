/**
 * Wallet covenant execution adapter (KaspaCom SDK shape, Hub-safe).
 * Prefers Hub unsigned Safe-JSON builder + signPskt + pushTx (KasCoven / KIP-12).
 * Falls back to wallet-native sendCovenantTransaction when present.
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
import { CovenantNotReadyError } from '@/lib/programmability/errors';

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
      return (
        Boolean(caps.hasNativeCovenantSubmit) ||
        caps.canSendCovenantTx ||
        Boolean(caps.canSignCovenantPskt && caps.canBroadcastSignedTx)
      );
    },
    async deploy(request, compiled) {
      const payloadHex = buildDeployPayloadHex({
        networkId: request.networkId,
        template: request.payloadTemplate,
        args: request.payloadArgs,
        meta: request.payloadMeta,
      });

      const { getCovenantCapabilities } = await import('@/lib/programmability/capabilities');
      const caps = await getCovenantCapabilities(provider);

      if (caps.canSignCovenantPskt && caps.canBroadcastSignedTx && compiled) {
        try {
          const { buildUnsignedCovenantDeploy } = await import('@/lib/covenant/builder');
          const {
            resolvePublicKeyHex,
            resolveSenderAddress,
            signAndBroadcastBuiltCovenant,
          } = await import('@/lib/covenant/builder/submit-built');

          const senderAddress = await resolveSenderAddress(provider);
          const publicKeyHex = await resolvePublicKeyHex(provider);
          const built = await buildUnsignedCovenantDeploy({
            template: request.template,
            amountSompi: request.amountSompi,
            compiled,
            transactionPayloadHex: payloadHex,
            ctx: {
              provider,
              networkId: request.networkId,
              senderAddress,
              publicKeyHex,
              computeBudget: 10,
            },
          });

          const result = await signAndBroadcastBuiltCovenant(provider, built);
          if (result.status === 'failed') {
            throw new CovenantNotReadyError(
              result.error || 'signPskt covenant deploy failed',
            );
          }
          return mapWalletResult(result);
        } catch (err) {
          if (err instanceof CovenantNotReadyError) throw err;
          if (!caps.hasNativeCovenantSubmit) {
            throw err instanceof Error
              ? err
              : new Error(String(err));
          }
          // Native wallet builder fallback
        }
      }

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
      const { getCovenantCapabilities } = await import('@/lib/programmability/capabilities');
      const caps = await getCovenantCapabilities(provider);

      if (caps.canSignCovenantPskt && caps.canBroadcastSignedTx && compiled) {
        try {
          const { buildUnsignedCovenantSpend } = await import('@/lib/covenant/builder');
          const {
            resolvePublicKeyHex,
            resolveSenderAddress,
            signAndBroadcastBuiltCovenant,
          } = await import('@/lib/covenant/builder/submit-built');

          const senderAddress = await resolveSenderAddress(provider);
          const publicKeyHex = await resolvePublicKeyHex(provider);
          const built = await buildUnsignedCovenantSpend({
            template: request.template,
            compiled,
            functionName: request.functionName,
            spendOutpoint: request.spendOutpoint,
            inputAmountSompi: request.inputAmountSompi,
            outputs: request.outputs,
            extraArgs: request.extraArgs,
            ctx: {
              provider,
              networkId: request.networkId,
              senderAddress,
              publicKeyHex,
              computeBudget: 10,
            },
          });
          const result = await signAndBroadcastBuiltCovenant(provider, built);
          if (result.status === 'failed') {
            throw new CovenantNotReadyError(result.error || 'signPskt covenant spend failed');
          }
          return mapWalletResult(result);
        } catch (err) {
          if (err instanceof CovenantNotReadyError) {
            if (!caps.hasNativeCovenantSubmit) throw err;
          } else if (!caps.hasNativeCovenantSubmit) {
            throw err instanceof Error ? err : new Error(String(err));
          }
        }
      }

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
