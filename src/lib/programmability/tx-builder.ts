import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import { sendCovenantTransaction as walletSendCovenant } from '@/lib/kaspa/wallet';
import {
  resolveSignInputs,
  resolveUnsignedTxJson,
  signAndBroadcastCovenantPskt,
} from '@/lib/kaspa/pskt-covenant';
import { loadCovenantArtifact } from './artifacts';
import { CovenantNotReadyError } from './errors';
import { getCovenantCapabilities } from './capabilities';
import type { CovenantTxRequest, CovenantTxResult } from './types';

/**
 * Submit a covenant L1 transaction.
 *
 * Preference order (KasCoven / KIP-12 aligned):
 * 1. If `unsignedTxJson` is present and the wallet has `signPskt` + `pushTx`, use that path.
 * 2. Else if the wallet exposes `sendCovenantTransaction`, use wallet-native build+sign.
 * 3. Else throw CovenantNotReadyError.
 */
export async function submitCovenantTransaction(
  provider: KaspaWalletProvider,
  request: CovenantTxRequest
): Promise<CovenantTxResult> {
  const caps = await getCovenantCapabilities(provider);
  const unsignedTxJson = resolveUnsignedTxJson(request);
  const canPsktPath = Boolean(
    unsignedTxJson && caps.canSignCovenantPskt && caps.canBroadcastSignedTx
  );
  const canNative = Boolean(caps.hasNativeCovenantSubmit || caps.canSendCovenantTx);

  if (!canPsktPath && !canNative) {
    const signHint = caps.canSignCovenantPskt
      ? ' Your wallet can sign via signPskt, but Hub still needs an unsigned Safe-JSON builder for this template (same pattern as vaults.kaslab.space).'
      : '';
    throw new CovenantNotReadyError(
      `Your wallet does not support Kaspa covenant transactions yet.${signHint} Use simulator mode, or a wallet with sendCovenantTransaction / signPskt+pushTx.`
    );
  }

  const artifact = await loadCovenantArtifact(request.template);
  if (!artifact.scriptHex) {
    throw new CovenantNotReadyError(
      `Covenant artifact for "${request.template}" is not compiled yet. Run npm run covenant:compile and redeploy.`
    );
  }

  const enriched: CovenantTxRequest = {
    ...request,
    params: {
      ...request.params,
      scriptHex: artifact.scriptHex,
      contract: artifact.contract,
      kind: request.kind,
      functionName: request.functionName,
      transactionPayloadHex: request.transactionPayloadHex,
      compiled: request.compiled ?? artifact.compiled ?? undefined,
    },
  };

  if (canPsktPath && unsignedTxJson) {
    const result = await signAndBroadcastCovenantPskt(provider, {
      unsignedTxJson,
      signInputs: resolveSignInputs(enriched),
      autoFinalize: false,
    });
    if (result.status === 'failed') {
      throw new CovenantNotReadyError(
        result.error || 'signPskt covenant submit failed'
      );
    }
    return result;
  }

  return walletSendCovenant(provider, enriched);
}
