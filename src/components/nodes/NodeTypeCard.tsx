'use client';

import type { NodeType } from '@/lib/nodes/types';

const CARD_CLASS =
  'bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6';

const NODE_TYPE_CONFIG: Record<
  NodeType,
  { name: string; multiplier: number; feeReduction: number; description: string }
> = {
  light: {
    name: 'Light Node',
    multiplier: 4,
    feeReduction: 0.1,
    description:
      'Pins IPFS/Storacha CIDs, caches dApp metadata, syncs with Kasparex API. Ideal for regular community members.',
  },
  mirror: {
    name: 'Mirror Node',
    multiplier: 5,
    feeReduction: 0.2,
    description:
      'Everything Light does, plus a read-only HTTP API as fallback data source. Ideal for power users and partners.',
  },
};

interface NodeTypeCardProps {
  nodeType: NodeType | null;
}

export function NodeTypeCard({ nodeType }: NodeTypeCardProps) {
  const config = nodeType ? NODE_TYPE_CONFIG[nodeType] : null;

  return (
    <section id="node-type" className="mb-8">
      <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
        Node Type
      </h2>
      <div className={CARD_CLASS}>
        {config ? (
          <>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {config.name}
              </h3>
              {nodeType === 'mirror' && (
                <span className="text-xs px-2 py-1 bg-[#02abb8]/20 text-[#02abb8] rounded-full">
                  Recommended
                </span>
              )}
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              {config.description}
            </p>
            <div className="flex flex-wrap gap-6 text-sm">
              <div>
                <span className="text-zinc-500 dark:text-zinc-500">
                  Reward multiplier
                </span>
                <span className="ml-2 font-semibold text-zinc-900 dark:text-zinc-100">
                  {config.multiplier}x
                </span>
              </div>
              <div>
                <span className="text-zinc-500 dark:text-zinc-500">
                  Fee reduction
                </span>
                <span className="ml-2 font-semibold text-zinc-900 dark:text-zinc-100">
                  {config.feeReduction}%
                </span>
              </div>
            </div>
          </>
        ) : (
          <p className="text-zinc-500 dark:text-zinc-500 text-sm">
            No node connected. Connect and register a node to see your type (Light
            or Mirror).
          </p>
        )}
      </div>
    </section>
  );
}
