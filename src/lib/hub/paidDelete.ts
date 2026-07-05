'use client';

import { kasToSompi } from '@/lib/ads/config';
import { getAdsTreasuryL1Address } from '@/lib/ads/config';
import { sendKaspaTransaction } from '@/lib/kaspa/wallet';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import type { HubContentKind } from '@/lib/hub/contentTypes';
import { markHubContentDeleted } from '@/lib/hub/deletedContent';
import { resetHubContentBootstrap, syncHubContentItem } from '@/lib/hub/contentSync';
import { requestIpfsUnpin } from '@/lib/ipfs/cidUtils';

/** Global KAS delete fees by hub content kind (before KREX tier discounts). */
export const HUB_DELETE_FEE_KAS: Record<HubContentKind, number> = {
  vblog: 0.1,
  tokens: 1,
  dapps: 1,
  chronicles: 1,
  magazines: 1,
  magazineIssues: 1,
  store: 1,
};

export function getHubDeleteTreasuryAddress(): string {
  return getAdsTreasuryL1Address();
}

export function buildHubDeletePlainNote(kind: HubContentKind, contentId: string, author: string): string {
  return `khx:delete:${kind}:${contentId}:${author}`;
}

export function buildHubDeletePayloadHex(kind: HubContentKind, contentId: string, author: string): string {
  const payload = JSON.stringify({ op: 'delete', kind, contentId, author, v: 1 });
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(payload, 'utf8').toString('hex');
  }
  const bytes = new TextEncoder().encode(payload);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export type HubContentDeleteFinalizeInput = {
  kind: HubContentKind;
  id: string;
  mediaCids?: string[];
  removeLocal: () => boolean | Promise<boolean>;
};

/** Tombstone, local removal, server registry delete, and optional IPFS unpin. */
export async function finalizeHubContentDelete(input: HubContentDeleteFinalizeInput): Promise<boolean> {
  markHubContentDeleted(input.kind, input.id);
  const removed = await Promise.resolve(input.removeLocal());
  if (!removed) return false;

  const synced = await syncHubContentItem(input.kind, 'delete', { id: input.id });
  if (!synced) {
    console.warn(`[hub/paidDelete] ${input.kind} removed locally but registry sync failed for id=${input.id}`);
  }

  resetHubContentBootstrap();

  if (input.mediaCids?.length) {
    void requestIpfsUnpin(input.mediaCids);
  }

  return true;
}

export type HubPaidDeleteInput = HubContentDeleteFinalizeInput & {
  feeKas: number;
  treasuryAddress?: string;
  note?: string;
  payload?: string;
  payerProvider: KaspaWalletProvider;
  payerAddress: string;
};

/** Pay KAS treasury fee, then run the standard hub delete finalize pipeline. */
export async function executeHubPaidDelete(input: HubPaidDeleteInput): Promise<{
  ok: boolean;
  txHash?: string;
  error?: string;
}> {
  const treasury = (input.treasuryAddress ?? getHubDeleteTreasuryAddress()).replace(/^kaspa:/, '');
  const note = input.note ?? buildHubDeletePlainNote(input.kind, input.id, input.payerAddress);
  const payload = input.payload ?? buildHubDeletePayloadHex(input.kind, input.id, input.payerAddress);

  const tx = await sendKaspaTransaction(input.payerProvider, {
    to: treasury,
    amount: String(kasToSompi(input.feeKas)),
    note,
    payload,
  });

  if (tx.status === 'failed' || !tx.txHash) {
    return { ok: false, error: tx.error ?? 'Delete transaction failed' };
  }

  const finalized = await finalizeHubContentDelete(input);
  if (!finalized) {
    return { ok: false, txHash: tx.txHash, error: 'Payment succeeded but content could not be removed.' };
  }

  return { ok: true, txHash: tx.txHash };
}
