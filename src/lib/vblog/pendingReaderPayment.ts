/**
 * Resume state for multi-tx reader payments (premium unlock / tips).
 * Survives "Insufficient funds" on a later wallet prompt so the user can continue
 * without re-paying completed legs.
 */

export type PendingVBlogReaderPayment = {
  articleId: string;
  moduleId: 'premium_unlock' | 'tip_to_reveal_unlock' | 'tip_box';
  payerAddress: string;
  currency: string;
  expectedAuthorKas: number;
  expectedPlatformKas: number;
  expectedAuthorAddress: string;
  authorRecipientAddresses: string[];
  authorTxHashes: string[];
  platformTxHash: string;
  updatedAt: string;
};

const STORAGE_KEY = 'vblog-pending-reader-payment-v1';

function storageKey(articleId: string, moduleId: string, payer: string): string {
  return `${STORAGE_KEY}:${articleId}:${moduleId}:${payer.toLowerCase()}`;
}

export function loadPendingVBlogReaderPayment(
  articleId: string,
  moduleId: string,
  payerAddress: string,
): PendingVBlogReaderPayment | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(storageKey(articleId, moduleId, payerAddress));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingVBlogReaderPayment;
    if (!parsed?.articleId || parsed.articleId !== articleId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function savePendingVBlogReaderPayment(pending: PendingVBlogReaderPayment): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      storageKey(pending.articleId, pending.moduleId, pending.payerAddress),
      JSON.stringify({ ...pending, updatedAt: new Date().toISOString() }),
    );
  } catch {
    /* ignore */
  }
}

export function clearPendingVBlogReaderPayment(
  articleId: string,
  moduleId: string,
  payerAddress: string,
): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(storageKey(articleId, moduleId, payerAddress));
  } catch {
    /* ignore */
  }
}
