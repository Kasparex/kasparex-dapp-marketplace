import type { Category } from '@/lib/categories';

export const DAPP_LISTING_FEE_KAS = 50;

export type DAppListingSubmission = {
  id: string;
  name: string;
  category: Category;
  description: string;
  websiteUrl: string;
  contactEmail: string;
  paymentPreference: 'KAS' | 'KREX';
  submitterAddress?: string;
  status: 'pending' | 'informational';
  submittedAt: string;
};

const STORAGE_KEY = 'kasparex_dapp_listing_submissions';

export function getDAppListingSubmissions(submitterAddress?: string): DAppListingSubmission[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const all: DAppListingSubmission[] = JSON.parse(raw);
    const sorted = all.sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
    );
    if (!submitterAddress) return sorted;
    return sorted.filter(
      (s) => s.submitterAddress?.toLowerCase() === submitterAddress.toLowerCase(),
    );
  } catch {
    return [];
  }
}

export function saveDAppListingSubmission(
  data: Omit<DAppListingSubmission, 'id' | 'status' | 'submittedAt'>,
): DAppListingSubmission {
  if (typeof window === 'undefined') {
    throw new Error('Cannot save listing submission on server');
  }

  const entry: DAppListingSubmission = {
    ...data,
    id: `dapp-listing-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    status: 'informational',
    submittedAt: new Date().toISOString(),
  };

  const existing = getDAppListingSubmissions();
  existing.unshift(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  window.dispatchEvent(new CustomEvent('dapp-listing-submissions-updated'));
  return entry;
}

export function getDAppListingSubmissionsByCategory(
  category: Category | 'all',
  submitterAddress?: string,
): DAppListingSubmission[] {
  const list = getDAppListingSubmissions(submitterAddress);
  if (category === 'all') return list;
  return list.filter((s) => s.category === category);
}
