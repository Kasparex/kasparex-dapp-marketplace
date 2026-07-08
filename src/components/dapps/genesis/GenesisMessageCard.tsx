'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AuthorInline } from '@/components/ui/AuthorInline';
import { renderRichContent } from '@/lib/richText/html';
import { getExplorerTxUrl } from '@/lib/store/utils';
import type { GenesisMessage } from '@/lib/vprogs/genesis-types';

function hubProfilePath(author: string): string {
  return `/u/${encodeURIComponent(author)}`;
}

function hubProfileUrl(author: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.kasparex.com';
  return `${origin}${hubProfilePath(author)}`;
}

function CopyLinkButton({ value, title }: { value: string; title: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      className="p-1 rounded border border-zinc-300 dark:border-zinc-600 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
      title={title}
      aria-label={title}
    >
      {copied ? (
        <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  );
}

type GenesisMessageCardProps = {
  message: GenesisMessage;
  walletAddress?: string | null;
  onDelete?: (message: GenesisMessage) => void;
};

export function GenesisMessageCard({ message, walletAddress, onDelete }: GenesisMessageCardProps) {
  const txHash = message.txHash || message.txRef || '';
  const explorerUrl = txHash ? getExplorerTxUrl(txHash) : null;
  const profilePath = hubProfilePath(message.author);
  const profileUrl = hubProfileUrl(message.author);
  const isAuthor =
    walletAddress &&
    message.author.trim().toLowerCase() === walletAddress.trim().toLowerCase();

  return (
    <article className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 space-y-3 text-sm dark:border-zinc-800 dark:bg-zinc-950/60">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <span className="text-xs font-mono font-semibold text-[#02abb8]">#{message.id}</span>
          <AuthorInline address={message.author} prefix="" href={profilePath} />
          {message.chunkCount > 0 ? (
            <span className="text-[10px] uppercase tracking-wide text-zinc-400">
              {message.chunkCount} chunk{message.chunkCount === 1 ? '' : 's'}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <time className="text-xs text-zinc-500 tabular-nums">
            {new Date(message.timestamp).toLocaleString()}
          </time>
          {isAuthor && onDelete ? (
            <button
              type="button"
              onClick={() => onDelete(message)}
              className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              Delete
            </button>
          ) : null}
        </div>
      </div>

      <div
        className="prose prose-sm max-w-none text-zinc-800 dark:prose-invert dark:text-zinc-200 [&_p]:my-1"
        dangerouslySetInnerHTML={{ __html: renderRichContent(message.contentHtml || message.message) }}
      />

      <div className="flex flex-col gap-2 pt-1 border-t border-zinc-200/80 dark:border-zinc-800/80">
        {explorerUrl ? (
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] uppercase tracking-wide text-zinc-400 shrink-0">Tx</span>
            <Link
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-[#02abb8] hover:underline truncate min-w-0"
            >
              {txHash.slice(0, 16)}...{txHash.slice(-8)}
            </Link>
            <CopyLinkButton value={explorerUrl} title="Copy transaction explorer link" />
          </div>
        ) : null}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] uppercase tracking-wide text-zinc-400 shrink-0">Author</span>
          <Link
            href={profilePath}
            className="text-xs text-[#02abb8] hover:underline truncate min-w-0"
          >
            Hub profile
          </Link>
          <CopyLinkButton value={profileUrl} title="Copy author Hub profile link" />
        </div>
      </div>
    </article>
  );
}
