import type { CharacterKind, ChronicleTimeline, VehicleKind } from '@/lib/chronicles/types';
import type { StorePaymentCurrency } from '@/lib/store/currencies';
import { mergeChroniclesSubmissions } from '@/lib/hub/contentMerge';
import { syncHubContentItem } from '@/lib/hub/contentSync';
import { finalizeHubContentDelete } from '@/lib/hub/paidDelete';
import { collectChroniclesMediaCids } from '@/lib/ipfs/cidUtils';

export type ChroniclesContentKind = 'chapter' | 'article' | 'character' | 'location' | 'vehicle';

export const CHRONICLES_SUBMISSION_FEES_KAS: Record<ChroniclesContentKind, number> = {
  chapter: 50,
  article: 30,
  character: 25,
  location: 20,
  vehicle: 20,
};

export const CHRONICLES_CONTENT_KIND_LABELS: Record<ChroniclesContentKind, string> = {
  chapter: 'Chapter',
  article: 'Article',
  character: 'Character',
  location: 'Location',
  vehicle: 'Vehicle / tech',
};

const STORAGE_KEY = 'chronicles-community-submissions-v1';

export type ChroniclesCommunitySubmission = {
  id: string;
  kind: ChroniclesContentKind;
  slug: string;
  title: string;
  summary: string;
  bodyMarkdown: string;
  authorAddress: string;
  submittedAt: string;
  status: 'active' | 'archived';
  source: 'community';
  feeAmountKas: number;
  paymentCurrency: StorePaymentCurrency;
  feeTxHash?: string;
  featuredImageUrl?: string;
  /** Kind-specific fields */
  chapterNumber?: number;
  timeline?: ChronicleTimeline;
  characterKind?: CharacterKind;
  vehicleKind?: VehicleKind;
  tags?: string[];
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

function readAll(): ChroniclesCommunitySubmission[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChroniclesCommunitySubmission[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(items: ChroniclesCommunitySubmission[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('chronicles-community-updated'));
}

export function listCommunitySubmissions(filter?: {
  kind?: ChroniclesContentKind;
  authorAddress?: string;
}): ChroniclesCommunitySubmission[] {
  let items = readAll().filter((i) => i.status === 'active');
  if (filter?.kind) items = items.filter((i) => i.kind === filter.kind);
  if (filter?.authorAddress) {
    const addr = filter.authorAddress.toLowerCase();
    items = items.filter((i) => i.authorAddress.toLowerCase() === addr);
  }
  return items.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

export function saveCommunitySubmission(
  input: Omit<ChroniclesCommunitySubmission, 'id' | 'slug' | 'submittedAt' | 'status' | 'source'> & {
    slug?: string;
  },
): ChroniclesCommunitySubmission {
  const baseSlug = input.slug ?? slugify(input.title);
  const slug = `community-${baseSlug}-${Date.now().toString(36)}`;
  const entry: ChroniclesCommunitySubmission = {
    ...input,
    id: `ch-sub-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    slug,
    submittedAt: new Date().toISOString(),
    status: 'active',
    source: 'community',
  };
  writeAll([entry, ...readAll()]);
  void syncHubContentItem('chronicles', 'upsert', { item: entry, commitTxHash: entry.feeTxHash });
  return entry;
}

export function getCommunitySubmissionBySlug(slug: string): ChroniclesCommunitySubmission | null {
  return readAll().find((i) => i.slug === slug && i.status === 'active') ?? null;
}

export function getCommunitySubmissionById(id: string): ChroniclesCommunitySubmission | null {
  return readAll().find((i) => i.id === id) ?? null;
}

/** Local archive only. Pair with executeHubPaidDelete from dashboards. */
export function archiveCommunitySubmissionLocal(id: string): boolean {
  const existing = readAll().find((i) => i.id === id);
  if (!existing) return false;
  writeAll(readAll().map((i) => (i.id === id ? { ...i, status: 'archived' as const } : i)));
  return true;
}

/** @deprecated Use executeHubPaidDelete from UI. Kept for legacy callers. */
export function archiveCommunitySubmission(id: string): boolean {
  const existing = readAll().find((i) => i.id === id);
  if (!existing) return false;
  if (!archiveCommunitySubmissionLocal(id)) return false;
  void finalizeHubContentDelete({
    kind: 'chronicles',
    id,
    mediaCids: collectChroniclesMediaCids(existing),
    removeLocal: () => true,
  });
  return true;
}

export function importRemoteChroniclesSubmissions(remote: ChroniclesCommunitySubmission[]): void {
  if (typeof window === 'undefined' || !remote.length) return;
  const merged = mergeChroniclesSubmissions(readAll(), remote);
  writeAll(merged);
}

export function submissionFeeKas(kind: ChroniclesContentKind): number {
  return CHRONICLES_SUBMISSION_FEES_KAS[kind];
}
