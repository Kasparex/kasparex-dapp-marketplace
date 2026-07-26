/**
 * Import covenant instance metadata from KaspaCom indexer (read-only).
 */

import { DEFAULT_PROGRAMMABLE_NETWORK, type ProgrammableNetworkId } from '@/lib/programmable/config';
import { resolveCovenantDetail } from '@/lib/programmable/covenantRead';
import type { CovenantReadSource } from '@/lib/programmable/types';
import type { CovenantVault, CovenantVaultKind } from '../types';

export type ImportedCovenantVault = Pick<
  CovenantVault,
  | 'covenantId'
  | 'beneficiary'
  | 'amountSompi'
  | 'status'
  | 'lockTxHash'
  | 'utxo'
  | 'kind'
  | 'unlockAt'
  | 'deadlineAt'
  | 'memo'
> & {
  source: CovenantReadSource;
  genesisTxid?: string;
  covenantAddress?: string | null;
  templateLabel?: string;
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
  const unlockMs = unlockRaw != null ? Number(unlockRaw) : 0;
  const deadlineRaw =
    detail.decodedArgs?.deadlineTimeMs ?? detail.decodedArgs?.deadline_at;
  const deadlineMs = deadlineRaw != null ? Number(deadlineRaw) : 0;
  const kind: CovenantVaultKind =
    Number.isFinite(unlockMs) && unlockMs > 0 ? 'timelock' : 'escrow';
  const kindArg = detail.decodedArgs?.kind;
  const kindFromArg =
    typeof kindArg === 'string' && (kindArg === 'timelock' || kindArg === 'escrow')
      ? kindArg
      : null;
  const isTimelock = kindFromArg === 'timelock' || kind === 'timelock';
  const memoFromMeta =
    (detail.decodedArgs?.label as string | undefined) ??
    (detail.decodedArgs?.memo as string | undefined) ??
    '';

  return {
    covenantId: detail.covenant_id,
    beneficiary,
    amountSompi: liveSompi,
    status: detail.status === 'burned' || Number(detail.live_utxos ?? 0) === 0 ? 'claimed' : 'locked',
    lockTxHash: detail.genesis_txid ?? undefined,
    utxo: detail.genesis_txid ? { txId: detail.genesis_txid, index: 0 } : undefined,
    kind: kindFromArg ?? kind,
    unlockAt: isTimelock ? unlockMs || null : null,
    deadlineAt:
      isTimelock && Number.isFinite(deadlineMs) && deadlineMs > 0 ? deadlineMs : null,
    memo: memoFromMeta.trim(),
    templateLabel: detail.template,
    source: detail.source,
    genesisTxid: detail.genesis_txid ?? undefined,
    covenantAddress: detail.address ?? null,
  };
}
