import type { UtxoEntry } from '@/lib/kaspa/l1WalletActions';
import { getL1UtxoEntries } from '@/lib/kaspa/l1WalletActions';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';

/**
 * Normalize wallet UTXO rows into createTransactions `entries` shape.
 * KasWare / Kastle field names vary; we accept the common variants.
 */
export function walletUtxosToGeneratorEntries(utxos: UtxoEntry[]): Record<string, unknown>[] {
  const entries: Record<string, unknown>[] = [];

  for (const raw of utxos) {
    const amountRaw = raw.amount ?? raw.value ?? (raw as { satoshis?: unknown }).satoshis;
    const amount = typeof amountRaw === 'bigint' ? amountRaw : BigInt(String(amountRaw ?? '0'));
    if (amount <= 0n) continue;

    const outpoint =
      (raw.outpoint as Record<string, unknown> | undefined) ??
      (raw.previousOutpoint as Record<string, unknown> | undefined) ??
      {};

    const transactionId = String(
      outpoint.transactionId ??
        outpoint.transaction_id ??
        outpoint.txId ??
        outpoint.txid ??
        raw.transactionId ??
        raw.txId ??
        '',
    );
    const index = Number(
      outpoint.index ?? outpoint.vout ?? raw.index ?? raw.vout ?? 0,
    );
    if (!transactionId) continue;

    const address = typeof raw.address === 'string' ? raw.address : undefined;
    const scriptPublicKey =
      raw.scriptPublicKey ??
      raw.script_public_key ??
      (typeof raw.scriptPubKey === 'string' ? raw.scriptPubKey : undefined);

    const entry: Record<string, unknown> = {
      address,
      amount,
      outpoint: { transactionId, index },
      scriptPublicKey,
      blockDaaScore: BigInt(
        String(raw.blockDaaScore ?? raw.block_daa_score ?? raw.daaScore ?? '0'),
      ),
      isCoinbase: Boolean(raw.isCoinbase ?? raw.is_coinbase ?? false),
    };

    const cid = raw.covenantId ?? raw.covenant_id;
    if (cid) entry.covenantId = String(cid);

    entries.push(entry);
  }

  return entries;
}

export async function loadWalletGeneratorEntries(
  provider: KaspaWalletProvider,
): Promise<Record<string, unknown>[]> {
  const utxos = await getL1UtxoEntries(provider);
  const entries = walletUtxosToGeneratorEntries(utxos);
  if (entries.length === 0) {
    throw new Error('No spendable KAS UTXOs found in the connected wallet');
  }
  return entries;
}
