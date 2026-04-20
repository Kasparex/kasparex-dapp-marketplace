'use client';

import type { NodeType } from '@/lib/nodes/types';
import { SectionHeader } from './SectionHeader';

const CARD_CLASS =
  'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl sm:rounded-[32px] overflow-hidden shadow-sm p-6';

const NODE_TYPE_CONFIG: Record<
  NodeType,
  { name: string; multiplier: number; feeReduction: number; description: string }
> = {
  light: {
    name: 'Light Node',
    multiplier: 4,
    feeReduction: 0.1,
    description:
      'Pins IPFS/Storacha CIDs, caches dApp/tools metadata locally, and periodically syncs with the Kasparex API. Ideal for regular community members.',
  },
  mirror: {
    name: 'Mirror Node',
    multiplier: 5,
    feeReduction: 0.2,
    description:
      'Everything Light does, plus a read-only HTTP API as fallback data source.',
  },
};

interface NodeTypeCardProps {
  nodeType: NodeType | null;
}

export function NodeTypeCard({ nodeType }: NodeTypeCardProps) {
  const config = nodeType ? NODE_TYPE_CONFIG[nodeType] : null;

  return (
    <section id="node-type-detail" className="mb-6">
      <div className={CARD_CLASS}>
        <SectionHeader title="Node type" />
        {config ? (
          <>
            <div className="mb-4 overflow-hidden rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-100 dark:bg-zinc-800 aspect-[3/2] relative">
              <div className="absolute inset-0 flex items-center justify-center text-zinc-400 dark:text-zinc-500">
                <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
                  />
                </svg>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {config.name}
              </h3>
              {nodeType === 'mirror' && (
                <span className="text-[10px] px-2 py-0.5 bg-[#02abb8]/20 text-[#02abb8] rounded-full font-bold uppercase tracking-wider">
                  Recommended
                </span>
              )}
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              {config.description}
            </p>
            <div className="flex flex-wrap gap-6 text-sm">
              <div>
                <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">
                  Multiplier
                </span>
                <span className="ml-2 font-bold text-[#02abb8]">
                  {config.multiplier}x
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">
                  Fee reduction
                </span>
                <span className="ml-2 font-bold text-zinc-900 dark:text-zinc-100">
                  {config.feeReduction}%
                </span>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-zinc-500 dark:text-zinc-500">
            No node connected. Register a node to see your type (Light or Mirror).
          </p>
        )}
      </div>
    </section>
  );
}
