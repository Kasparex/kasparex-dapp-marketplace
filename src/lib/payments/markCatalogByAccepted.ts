import type { HubCurrencyCatalogEntry } from '@/lib/payments/currencyCatalog';

/**
 * Keep the full Hub Select currency modal, but lock rows the product does not accept.
 */
export function markCatalogByAcceptedCurrencies(
  entries: HubCurrencyCatalogEntry[],
  accepted: string[],
): HubCurrencyCatalogEntry[] {
  if (!accepted.length) return entries;
  const set = new Set(accepted.map((a) => a.trim().toUpperCase()).filter(Boolean));
  return entries.map((entry) => {
    const keys = [entry.id, entry.tick, entry.label]
      .filter(Boolean)
      .map((k) => String(k).toUpperCase());
    const ok = keys.some((k) => set.has(k));
    if (ok) {
      return entry.status === 'available' ? entry : { ...entry, status: 'available' as const };
    }
    return {
      ...entry,
      status: 'locked' as const,
      detail: entry.detail ?? 'Not accepted for this payment',
      actionHref: entry.actionHref,
      actionLabel: entry.actionLabel ?? 'Not accepted here',
    };
  });
}
