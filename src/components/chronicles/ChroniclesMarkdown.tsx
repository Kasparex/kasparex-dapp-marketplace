'use client';

import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { linkifyWikiTokens } from '@/lib/chronicles/linkify';

const prose =
  'max-w-none text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed [&_strong]:text-zinc-900 [&_strong]:dark:text-zinc-100';

export function ChroniclesMarkdown({ markdown }: { markdown: string }) {
  const md = linkifyWikiTokens(markdown);

  return (
    <div className={prose}>
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
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-8 mb-3 tracking-tight">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-8 mb-3 tracking-tight border-b border-zinc-200 dark:border-zinc-800 pb-2">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mt-6 mb-2">{children}</h3>
          ),
          p: ({ children }) => <p className="mb-4">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-5 mb-4 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 mb-4 space-y-1">{children}</ol>,
          li: ({ children }) => <li>{children}</li>,
          hr: () => <hr className="my-8 border-zinc-200 dark:border-zinc-800" />,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-cyan-500/40 pl-4 my-6 italic text-zinc-500 dark:text-zinc-400 text-sm">
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-xs font-mono text-zinc-800 dark:text-zinc-200">
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
