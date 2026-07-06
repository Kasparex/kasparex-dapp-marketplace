/**
 * Import covenant instance metadata from KaspaCom indexer (read-only).
 */

import { DEFAULT_PROGRAMMABLE_NETWORK, type ProgrammableNetworkId } from '@/lib/programmable/config';
import { resolveCovenantDetail } from '@/lib/programmable/covenantRead';
import type { CovenantVault, CovenantVaultKind } from '../types';

export type ImportedCovenantVault = Pick<
  CovenantVault,
  'covenantId' | 'beneficiary' | 'amountSompi' | 'status' | 'lockTxHash' | 'utxo' | 'templateLabel'
> & {
  source: 'kaspaCom' | 'kascov';
  genesisTxid?: string;
  covenantAddress?: string | null;
};

export async function importVaultFromCovenantId(
  covenantId: string,
  depositor: string,
  networkId: ProgrammableNetworkId = DEFAULT_PROGRAMMABLE_NETWORK,
): Promise<ImportedCovenantVault | null> {
  const detail = await resolveCovenantDetail(covenantId, networkId);
  if (!detail) return null;

  const liveSompi =
    detail.live_value != null && Number.isFinite(detail.live_value)
      ? String(Math.max(0, Math.floor(detail.live_value)))
      : '0';

  const beneficiary =
    (detail.decodedArgs?.beneficiary as string | undefined) ??
    (detail.decodedArgs?.owner as string | undefined) ??
    depositor;

  const unlockRaw = detail.decodedArgs?.unlockTimeMs ?? detail.decodedArgs?.unlock_at;
  const kind: CovenantVaultKind =
    unlockRaw != null && Number(unlockRaw) > 0 ? 'timelock' : 'escrow';

  return {
    covenantId: detail.covenant_id,
    beneficiary,
    amountSompi: liveSompi,
    status: detail.status === 'burned' || Number(detail.live_utxos ?? 0) === 0 ? 'claimed' : 'locked',
    lockTxHash: detail.genesis_txid ?? undefined,
    utxo: detail.genesis_txid ? { txId: detail.genesis_txid, index: 0 } : undefined,
    templateLabel: detail.template,
    source: detail.source,
    genesisTxid: detail.genesis_txid ?? undefined,
    covenantAddress: detail.address ?? null,
  };
}
