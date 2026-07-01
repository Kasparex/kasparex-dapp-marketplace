'use client';

import { getAllArticles } from '@/lib/vblog/data';
import type { VBlogArticle } from '@/lib/vblog/types';

export type MagazineSubmissionStatus = 'pending' | 'accepted' | 'rejected';

const STORAGE_KEY = 'kasparex_magazine_submission_status';

function readStatusMap(): Record<string, MagazineSubmissionStatus> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, MagazineSubmissionStatus>) : {};
  } catch {
    return {};
  }
}

function writeStatusMap(map: Record<string, MagazineSubmissionStatus>): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function getSubmissionStatus(articleId: string): MagazineSubmissionStatus {
  return readStatusMap()[articleId] ?? 'pending';
}

export function setSubmissionStatus(articleId: string, status: MagazineSubmissionStatus): void {
  const map = readStatusMap();
  map[articleId] = status;
  writeStatusMap(map);
}

const PUBLISHED_STATUSES = new Set([
  'published',
  'on-chain-ready',
  'verified',
  'verification_pending',
]);

export function getVBlogSubmissionsForIssue(magazineId: string, issueNumber: number): VBlogArticle[] {
  if (typeof window === 'undefined') return [];
  return getAllArticles().filter((article) => {
    if (article.linkedMagazineId !== magazineId) return false;
    if (article.linkedIssueNumber !== issueNumber) return false;
    if (!PUBLISHED_STATUSES.has(article.status)) return false;
    if (getSubmissionStatus(article.id) === 'rejected') return false;
    return true;
  });
}

export function registerMagazineSubmission(articleId: string): void {
  const map = readStatusMap();
  if (!map[articleId]) {
    map[articleId] = 'pending';
    writeStatusMap(map);
  }
}
