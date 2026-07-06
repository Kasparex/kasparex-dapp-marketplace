import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import { sendCovenantTransaction as walletSendCovenant } from '@/lib/kaspa/wallet';
import { loadCovenantArtifact } from './artifacts';
import { CovenantNotReadyError } from './errors';
import { getCovenantCapabilities } from './capabilities';
import type { CovenantTxRequest, CovenantTxResult } from './types';

/**
 * Submit a covenant L1 transaction.
 * Prefers wallet-native build+sign; requires compiled artifact metadata.
 */
export async function submitCovenantTransaction(
  provider: KaspaWalletProvider,
  request: CovenantTxRequest
): Promise<CovenantTxResult> {
  const caps = await getCovenantCapabilities(provider);
  if (!caps.canSendCovenantTx) {
    throw new CovenantNotReadyError(
      'Your wallet does not support Kaspa covenant transactions yet. Use simulator mode or a Toccata-ready wallet (KasWare / Kastle when available).'
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

  return walletSendCovenant(provider, enriched);
}
