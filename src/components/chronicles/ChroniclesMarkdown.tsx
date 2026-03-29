'use client';

import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { linkifyWikiTokens } from '@/lib/chronicles/linkify';

const prose =
  'chronicles-prose max-w-none text-base sm:text-lg text-zinc-700 dark:text-zinc-300 [&_strong]:text-zinc-900 [&_strong]:dark:text-zinc-100';

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
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-zinc-900 dark:text-zinc-100 mt-10 mb-5 tracking-tight">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-zinc-900 dark:text-zinc-100 mt-12 mb-5 tracking-tight border-b border-cyan-500/20 pb-3">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-10 mb-4">{children}</h3>
          ),
          p: ({ children }) => <p className="leading-relaxed mb-5">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-6 mb-5 space-y-2">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-6 mb-5 space-y-2">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          hr: () => <hr className="my-12 border-zinc-200 dark:border-zinc-800" />,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-cyan-500/40 pl-5 my-8 italic text-zinc-600 dark:text-zinc-400 text-base sm:text-lg">
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-sm sm:text-base font-mono text-zinc-800 dark:text-zinc-200">
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
