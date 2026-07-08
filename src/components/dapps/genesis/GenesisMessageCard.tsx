'use client';

import { renderRichContent } from '@/lib/richText/html';
import type { GenesisMessage } from '@/lib/vprogs/genesis-types';

function shortAddr(addr: string): string {
  if (addr.length <= 14) return addr;
  return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
}

export function GenesisMessageCard({ message }: { message: GenesisMessage }) {
  return (
    <article className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 space-y-3 text-sm dark:border-zinc-800 dark:bg-zinc-950/60">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono font-semibold text-[#02abb8]">#{message.id}</span>
          <span className="text-xs font-mono text-zinc-500">{shortAddr(message.author)}</span>
          {message.chunkCount > 0 ? (
            <span className="text-[10px] uppercase tracking-wide text-zinc-400">
              {message.chunkCount} chunk{message.chunkCount === 1 ? '' : 's'}
            </span>
          ) : null}
        </div>
        <time className="text-xs text-zinc-500 tabular-nums">
          {new Date(message.timestamp).toLocaleString()}
        </time>
      </div>
      <div
        className="prose prose-sm max-w-none text-zinc-800 dark:prose-invert dark:text-zinc-200 [&_p]:my-1"
        dangerouslySetInnerHTML={{ __html: renderRichContent(message.contentHtml || message.message) }}
      />
    </article>
  );
}
