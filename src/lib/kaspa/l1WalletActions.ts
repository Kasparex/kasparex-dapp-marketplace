/**
 * Provider-aware L1 actions (KasWare vs Kastle) for KAS sends, KRC-20 transfers, and UTXOs.
 */

import type { KaspaWalletProvider } from './types';
import { signKRC20Transaction as kaswareSignKrc20, getUtxoEntries as kaswareGetUtxoEntries } from './kasware';
import { normalizeKaspaAddress } from './sdk';

function getKastle(): Record<string, unknown> | null {
  if (typeof window === 'undefined') return null;
  const k = (window as unknown as { kastle?: Record<string, unknown> }).kastle;
  return k && typeof k === 'object' ? k : null;
}

export function mapKastleNetworkId(net: unknown): 'mainnet' | 'testnet-10' {
  const s = String(net ?? '').toLowerCase();
  if (s.includes('test') || s.includes('10') || s === 'testnet-10') return 'testnet-10';
  return 'mainnet';
}

async function kastleNetworkId(): Promise<'mainnet' | 'testnet-10'> {
  const k = getKastle();
  if (!k || typeof k.getNetwork !== 'function') return 'mainnet';
  try {
    const net = await (k.getNetwork as () => Promise<unknown>)();
    return mapKastleNetworkId(net);
  } catch {
    return 'mainnet';
  }
}

/** Kastle Kasplex commit/reveal expects protocol field lowercase per Kasplex tooling. */
function normalizeKrc20InscribeForKastle(inscribeJsonString: string): string {
  const o = JSON.parse(inscribeJsonString) as Record<string, unknown>;
  if (typeof o.p === 'string' && o.p.toUpperCase() === 'KRC-20') {
    o.p = 'krc-20';
  }
  return JSON.stringify(o);
}

function krc20TransferTypeNumber(type: string | number): number {
  if (typeof type === 'number') return type;
  const n = parseInt(String(type), 10);
  return Number.isNaN(n) ? 4 : n;
}

/**
 * Sign / broadcast a KRC-20 transfer (KasWare signKRC20Transaction, Kastle commitReveal).
 */
export async function signKrc20Transfer(
  provider: KaspaWalletProvider,
  inscribeJsonString: string,
  type: string | number,
  destAddr: string,
  priorityFee?: number | string
): Promise<string> {
  const normalizedDest = normalizeKaspaAddress(destAddr);
  if (provider === 'kasware') {
    return kaswareSignKrc20(inscribeJsonString, type, normalizedDest, priorityFee);
  }

  if (provider === 'kastle') {
    const k = getKastle();
    if (!k || typeof k.commitReveal !== 'function') {
      throw new Error('Kastle commitReveal is not available. Update Kastle or use KasWare for this action.');
    }

    const typeNum = krc20TransferTypeNumber(type);
    if (typeNum !== 4) {
      throw new Error('Kastle only supports KRC-20 transfer (type 4) via commitReveal.');
    }

    const networkId = await kastleNetworkId();
    let data: string;
    try {
      data = normalizeKrc20InscribeForKastle(inscribeJsonString);
    } catch {
      data = inscribeJsonString;
    }

    let revealPriorityFee: string | undefined;
    if (priorityFee != null && priorityFee !== '') {
      const kas = typeof priorityFee === 'number' ? priorityFee : parseFloat(String(priorityFee));
      if (!Number.isNaN(kas) && kas > 0) {
        revealPriorityFee = String(Math.round(kas * 100_000_000));
      }
    }

    const opts = revealPriorityFee ? { revealPriorityFee } : {};
    const res = await (k.commitReveal as (
      nid: 'mainnet' | 'testnet-10',
      ns: string,
      payload: string,
      options?: { revealPriorityFee?: string }
    ) => Promise<{ revealTxId?: string; commitTxId?: string } | string>)(networkId, 'kasplex', data, opts);

    if (typeof res === 'string' && res) return res;
    if (res && typeof res === 'object') {
      const reveal = (res as { revealTxId?: string; reveal_tx_id?: string }).revealTxId
        ?? (res as { reveal_tx_id?: string }).reveal_tx_id;
      const commit = (res as { commitTxId?: string; commit_tx_id?: string }).commitTxId
        ?? (res as { commit_tx_id?: string }).commit_tx_id;
      if (typeof reveal === 'string' && reveal) return reveal;
      if (typeof commit === 'string' && commit) return commit;
    }
    throw new Error('Kastle did not return a transaction id for the KRC-20 transfer.');
  }

  throw new Error(`KRC-20 transfers are not supported for this wallet (${provider}).`);
}

export type UtxoEntry = { amount: number | string; [key: string]: unknown };

/**
 * UTXO list for the active L1 provider (normalizes Kastle `{ entries }` shape).
 */
export async function getL1UtxoEntries(provider: KaspaWalletProvider): Promise<UtxoEntry[]> {
  if (provider === 'kasware') {
    return kaswareGetUtxoEntries();
  }

  if (provider === 'kastle') {
    const k = getKastle();
    if (!k || typeof k.getUtxoEntries !== 'function') {
      throw new Error('Kastle getUtxoEntries is not available.');
    }
    const raw = await (k.getUtxoEntries as () => Promise<unknown>)();
    if (Array.isArray(raw)) return raw as UtxoEntry[];
    if (raw && typeof raw === 'object' && Array.isArray((raw as { entries?: unknown }).entries)) {
      return (raw as { entries: UtxoEntry[] }).entries;
    }
    return [];
  }

  throw new Error(`UTXO list is not supported for this wallet (${provider}).`);
}
