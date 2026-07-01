'use client';

import { useState } from 'react';
import { getVBlogSubmissionsForIssue, setSubmissionStatus } from '@/lib/magazines/submissions';
import type { MagazineSection } from '@/lib/magazines/manifest';
import type { VBlogArticle } from '@/lib/vblog/types';

interface VBlogSubmissionsPanelProps {
  magazineId: string | null;
  issueNumber: number | null;
  includedSlugs: string[];
  onAddArticle: (article: VBlogArticle) => void;
  onRemoveSlug: (slug: string) => void;
}

export function VBlogSubmissionsPanel({
  magazineId,
  issueNumber,
  includedSlugs,
  onAddArticle,
  onRemoveSlug,
}: VBlogSubmissionsPanelProps) {
  const [refreshTick, setRefreshTick] = useState(0);

  const submissions =
    !magazineId || !issueNumber ? [] : getVBlogSubmissionsForIssue(magazineId, issueNumber);
  void refreshTick;

  if (!magazineId || !issueNumber) {
    return (
      <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-2">vBlog submissions</h3>
        <p className="text-[10px] text-zinc-500 leading-relaxed">
          Select an existing magazine (or finish slug setup) to review articles linked to the upcoming issue.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
      <div>
        <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-1">vBlog submissions</h3>
        <p className="text-[10px] text-zinc-500 leading-relaxed">
          Articles with Magazine Integration linked to Issue #{issueNumber}. Add accepted pieces into this issue before
          publishing.
        </p>
      </div>

      {includedSlugs.length > 0 ? (
        <div className="space-y-2">
          <div className="text-[10px] font-bold text-emerald-600 uppercase">In this issue</div>
          {includedSlugs.map((slug) => (
            <div
              key={slug}
              className="flex items-center justify-between gap-2 p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20"
            >
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">{slug}</span>
              <button
                type="button"
                onClick={() => onRemoveSlug(slug)}
                className="text-[10px] font-bold text-red-500 hover:underline shrink-0"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {submissions.length === 0 ? (
        <p className="text-xs text-zinc-500 italic">No linked vBlog articles for this issue yet.</p>
      ) : (
        <ul className="space-y-2 max-h-48 overflow-y-auto">
          {submissions.map((article) => {
            const included = includedSlugs.includes(article.slug);
            return (
              <li
                key={article.id}
                className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-2"
              >
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 line-clamp-2">{article.title}</div>
                <div className="text-[10px] text-zinc-500 font-mono truncate">{article.author}</div>
                <div className="flex flex-wrap gap-2">
                  {!included ? (
                    <button
                      type="button"
                      onClick={() => {
                        onAddArticle(article);
                        setSubmissionStatus(article.id, 'accepted');
                        setRefreshTick((t) => t + 1);
                      }}
                      className="px-2 py-1 rounded-md bg-cyan-500 text-white text-[10px] font-bold hover:bg-cyan-600"
                    >
                      Add to issue
                    </button>
                  ) : (
                    <span className="text-[10px] font-bold text-emerald-600">Added</span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSubmissionStatus(article.id, 'rejected');
                      setRefreshTick((t) => t + 1);
                    }}
                    className="px-2 py-1 rounded-md border border-zinc-300 dark:border-zinc-700 text-[10px] font-bold text-zinc-500 hover:text-red-500"
                  >
                    Dismiss
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function vblogSectionsFromSlugs(slugs: string[]): MagazineSection[] {
  return slugs.map((slug) => ({
    type: 'vblog_article' as const,
    slug,
    includePremium: false,
  }));
}
