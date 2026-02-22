'use client';

import Link from 'next/link';
import type { NodeInfo } from '@/lib/nodes/types';

const CARD_CLASS =
  'rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900 p-6';

interface ConnectAndRegisterProps {
  nodeInfo: NodeInfo;
}

export function ConnectAndRegister({ nodeInfo }: ConnectAndRegisterProps) {
  return (
    <section id="connect-register" className="mb-6">
      <div className={CARD_CLASS}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
          <h2 className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
            Connection guide
          </h2>
        </div>
        <p className="text-zinc-600 dark:text-zinc-400 mb-4 text-sm leading-relaxed">
          Run a KREX Node on your machine to support the Kasparex ecosystem and earn rewards.
          Install Node.js, clone the repo, then start and register your node.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/api/krex-node"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Run a KREX Node
          </Link>
          <a
            href="https://github.com/Kasparex/kasparex-krex-node"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            View on GitHub
          </a>
        </div>
        {nodeInfo.status !== 'not_registered' && (
          <p className="mt-4 text-[10px] font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">
            Registration status: Registered
          </p>
        )}
      </div>
    </section>
  );
}
