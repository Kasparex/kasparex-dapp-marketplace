'use client';

import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { linkifyWikiTokens } from '@/lib/chronicles/linkify';
import { CHRONICLES_PROSE } from '@/lib/chronicles/typography';

export function ChroniclesMarkdown({ markdown }: { markdown: string }) {
  const md = linkifyWikiTokens(markdown);

  return (
    <div className={CHRONICLES_PROSE}>
      <ReactMarkdown
        components={{
          a: ({ href, children }) => {
            if (href?.startsWith('/')) {
              return (
                <Link href={href} className="text-[#02abb8] hover:underline font-semibold">
                  {children}
                </Link>
              );
            }
            return (
              <a
                href={href}
                className="text-[#02abb8] hover:underline font-semibold"
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            );
          },
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-8 mb-4 tracking-tight leading-snug">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-8 mb-3 tracking-tight border-b border-zinc-200 dark:border-zinc-800 pb-2 leading-snug">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-6 mb-2 leading-snug">{children}</h3>
          ),
          p: ({ children }) => <p className="mb-5">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-5 mb-5 space-y-2">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 mb-5 space-y-2">{children}</ol>,
          li: ({ children }) => <li className="leading-8">{children}</li>,
          hr: () => <hr className="my-10 border-zinc-200 dark:border-zinc-800" />,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-cyan-500/40 pl-4 my-6 italic text-zinc-600 dark:text-zinc-400 text-base leading-relaxed">
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-sm font-mono text-zinc-800 dark:text-zinc-200">
              {children}
            </code>
          ),
        }}
      >
        {md}
      </ReactMarkdown>
    </div>
  );
}
