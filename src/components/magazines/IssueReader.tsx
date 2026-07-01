'use client';

import Link from 'next/link';
import { KxRichTextContent } from '@/components/ui/KxRichTextContent';
import type { ComposedSection } from '@/lib/magazines/composeIssue';
import type { Magazine, MagazineIssue } from '@/lib/magazines/types';

interface IssueReaderProps {
  magazine: Magazine;
  issue: MagazineIssue;
  sections: ComposedSection[];
  usingFallback?: boolean;
}

export function IssueReader({ magazine, issue, sections, usingFallback }: IssueReaderProps) {
  return (
    <article className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-xl">
      <header className="px-6 sm:px-10 py-10 border-b border-zinc-100 dark:border-zinc-800 bg-gradient-to-br from-cyan-500/5 to-emerald-500/5">
        <p className="text-xs font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-400 mb-2">
          {magazine.name} · Issue #{issue.issueNumber}
        </p>
        <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-zinc-100 leading-tight">
          {issue.title}
        </h1>
        {usingFallback ? (
          <p className="mt-3 text-xs text-zinc-500">
            Demo reader content (IPFS manifest unavailable for this preview CID).
          </p>
        ) : null}
      </header>

      <div className="px-6 sm:px-10 py-10 space-y-10">
        {sections.length === 0 ? (
          <p className="text-zinc-500 text-center py-12">No readable sections in this issue yet.</p>
        ) : null}

        {sections.map((section, index) => {
          if (section.kind === 'text' && section.title && !section.html) {
            return (
              <h2
                key={`section-${index}`}
                className="text-2xl font-black text-zinc-900 dark:text-zinc-100 pt-4 border-t border-zinc-100 dark:border-zinc-800 first:border-0 first:pt-0"
              >
                {section.title}
              </h2>
            );
          }

          if (section.kind === 'article') {
            return (
              <section key={`article-${section.article.slug}-${index}`} className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{section.article.title}</h2>
                    <p className="text-sm text-zinc-500 mt-1">{section.article.category}</p>
                  </div>
                  <Link
                    href={`/vblog/${encodeURIComponent(section.article.slug)}`}
                    className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline shrink-0"
                  >
                    Open on vBlog
                  </Link>
                </div>
                {section.article.description ? (
                  <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">{section.article.description}</p>
                ) : null}
                <KxRichTextContent html={section.html} />
              </section>
            );
          }

          if (section.kind === 'text' && section.html) {
            return (
              <div key={`text-${index}`} className="space-y-4">
                {section.title ? (
                  <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{section.title}</h2>
                ) : null}
                <KxRichTextContent html={section.html} />
              </div>
            );
          }

          return null;
        })}
      </div>
    </article>
  );
}
