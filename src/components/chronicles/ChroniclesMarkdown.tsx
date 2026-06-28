'use client';

import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { linkifyWikiTokens } from '@/lib/chronicles/linkify';
import { KX_PROSE, KX_PROSE_LIST, KX_PROSE_LIST_ITEM, KX_PROSE_PARAGRAPH } from '@/lib/ui/kxTypography';

export function ChroniclesMarkdown({ markdown }: { markdown: string }) {
  const md = linkifyWikiTokens(markdown);

  return (
    <div className={KX_PROSE}>
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
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-12 mb-5 tracking-tight leading-snug first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-12 mb-4 tracking-tight border-b border-zinc-200 dark:border-zinc-800 pb-3 leading-snug">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-10 mb-3 leading-snug">{children}</h3>
          ),
          p: ({ children }) => <p className={KX_PROSE_PARAGRAPH}>{children}</p>,
          ul: ({ children }) => <ul className={`list-disc pl-5 ${KX_PROSE_LIST}`}>{children}</ul>,
          ol: ({ children }) => <ol className={`list-decimal pl-5 ${KX_PROSE_LIST}`}>{children}</ol>,
          li: ({ children }) => <li className={KX_PROSE_LIST_ITEM}>{children}</li>,
          hr: () => <hr className="my-12 border-zinc-200 dark:border-zinc-800" />,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-cyan-500/40 pl-5 my-8 italic text-zinc-600 dark:text-zinc-400 text-base leading-8">
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
