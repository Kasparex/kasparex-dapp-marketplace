'use client';

import { getMagazineById, getIssuesForMagazine } from '@/lib/magazines/data';

/** Public issue URL uses magazine slug, not internal id. */
export function getMagazineIssueHref(magazineId: string, issueNumber: number): string {
  const mag = getMagazineById(magazineId);
  if (!mag) return '/magazines';

  const published = getIssuesForMagazine(magazineId).some((i) => i.issueNumber === issueNumber);
  if (published) {
    return `/magazines/${encodeURIComponent(mag.slug)}/${issueNumber}`;
  }

  return `/magazines/${encodeURIComponent(mag.slug)}`;
}

export function getMagazineIssueLinkLabel(magazineId: string, issueNumber: number): string {
  const mag = getMagazineById(magazineId);
  const name = mag?.name ?? 'Magazine';
  return `${name} · Issue #${issueNumber}`;
}
