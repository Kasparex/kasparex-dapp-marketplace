import type { ChroniclesContentKind } from '@/lib/chronicles/communitySubmissions';

const KIND_SEGMENT: Record<ChroniclesContentKind, string> = {
  chapter: 'chapters',
  article: 'articles',
  character: 'characters',
  location: 'locations',
  vehicle: 'vehicles',
};

export function communityDetailHref(kind: ChroniclesContentKind, slug: string): string {
  return `/chronicles/${KIND_SEGMENT[kind]}/${slug}`;
}
