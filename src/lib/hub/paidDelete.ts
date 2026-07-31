'use client';

import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import { getAdsTreasuryL1Address } from '@/lib/ads/config';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import type { HubContentKind } from '@/lib/hub/contentTypes';
import { markHubContentDeleted } from '@/lib/hub/deletedContent';
import { resetHubContentBootstrap, syncHubContentItem } from '@/lib/hub/contentSync';
import { requestIpfsUnpin } from '@/lib/ipfs/cidUtils';
import { payKasPaymentPlan } from '@/lib/payments/kasMultiOutPay';
import { buildHubPlatformFeePlan } from '@/lib/payments/paymentPlan';

/** Global flat KAS delete fee for all hub content (before KREX tier discounts). */
export const HUB_DELETE_FEE_KAS_STANDARD = 0.5;

/** Global KAS delete fees by hub content kind (before KREX tier discounts). */
export const HUB_DELETE_FEE_KAS: Record<HubContentKind, number> = {
  vblog: HUB_DELETE_FEE_KAS_STANDARD,
  tokens: HUB_DELETE_FEE_KAS_STANDARD,
  dapps: HUB_DELETE_FEE_KAS_STANDARD,
  chronicles: HUB_DELETE_FEE_KAS_STANDARD,
  magazines: HUB_DELETE_FEE_KAS_STANDARD,
  magazineIssues: HUB_DELETE_FEE_KAS_STANDARD,
  store: HUB_DELETE_FEE_KAS_STANDARD,
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

/** Pay KAS treasury fee (multi-out when rewards split applies), then run delete finalize. */
export async function executeHubPaidDelete(input: HubPaidDeleteInput): Promise<{
  ok: boolean;
  txHash?: string;
  error?: string;
}> {
  const treasury = (input.treasuryAddress ?? getHubDeleteTreasuryAddress()).replace(/^kaspa:/, '');
  const note = input.note ?? buildHubDeletePlainNote(input.kind, input.id, input.payerAddress);
  const payload = input.payload ?? buildHubDeletePayloadHex(input.kind, input.id, input.payerAddress);

  try {
    const plan = buildHubPlatformFeePlan({
      totalKas: input.feeKas,
      treasuryAddress: treasury,
      note,
      payloadHex: payload,
    });
    const paid = await payKasPaymentPlan(input.payerProvider, plan, input.payerAddress);
    if (!paid.txHash) {
      return { ok: false, error: 'Delete transaction failed' };
    }
    const txHash = extractKaspaTransactionId(paid.txHash) ?? paid.txHash;

    const finalized = await finalizeHubContentDelete(input);
    if (!finalized) {
      return { ok: false, txHash, error: 'Payment succeeded but content could not be removed.' };
    }

    return { ok: true, txHash };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Delete transaction failed',
    };
  }
}
