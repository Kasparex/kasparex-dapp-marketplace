import { sendKaspaTransaction } from '@/lib/kaspa/wallet';
import { formatKaspaWalletError } from '@/lib/kaspa/formatWalletError';
import { getAdsTreasuryL1Address, kasToSompi } from '@/lib/ads/config';
import { ADS_KREX_BINDING_FEE_KAS } from '@/lib/ads/constants';
import { buildAdsBindingPayloadHex } from '@/lib/ads/payloadHex';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import {
  isStorageMassErrorMessage,
  readHighMassMode,
  retryKasCandidates,
} from '@/lib/kaspa/tx-mass-mode';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';

/**
 * Send an L1 treasury tx carrying the campaign metadata CID in the payload (no duplicate note).
 * Retries with higher KAS amounts when the wallet hits storage mass limits.
 */
export async function sendAdsMetadataBindingTx(
  provider: KaspaWalletProvider,
  metadataCid: string,
  baseKas: number = ADS_KREX_BINDING_FEE_KAS,
): Promise<string> {
  const treasuryAddress = getAdsTreasuryL1Address();
  const payloadHex = buildAdsBindingPayloadHex(metadataCid);
  const highMass = readHighMassMode();
  const candidates = retryKasCandidates(baseKas, highMass);

  let lastErr: string | null = null;

  for (const candidateKas of candidates) {
    const sompi = kasToSompi(candidateKas);
    if (sompi <= 0) continue;

    const txRes = await sendKaspaTransaction(provider, {
      to: treasuryAddress,
      amount: String(sompi),
      payload: payloadHex,
    });

    if (txRes.status !== 'failed' && txRes.txHash) {
      return extractKaspaTransactionId(txRes.txHash) ?? txRes.txHash;
    }

    lastErr = txRes.error ?? 'Binding transaction was rejected or failed';
    const formatted = formatKaspaWalletError(lastErr);
    if (!isStorageMassErrorMessage(formatted)) break;
  }

  throw new Error(formatKaspaWalletError(lastErr ?? 'Binding transaction failed'));
}
