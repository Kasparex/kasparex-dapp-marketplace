'use client';

import { SectionHeader } from './SectionHeader';

const CARD_CLASS = 'rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900 p-6';

const LIGHT_NODE = {
  name: 'Light Node',
  description:
    'Pins IPFS/Storacha CIDs, caches dApp/tools metadata locally, and periodically syncs with the Kasparex API. Ideal for regular community members.',
  features: ['Pins CIDs', 'Caches metadata', 'Syncs with API', 'Low resource use'],
};

const MIRROR_NODE = {
  name: 'Mirror Node',
  description: 'Everything Light Node does, plus exposes a read-only HTTP API that can serve as a fallback data source. Ideal for power users and partners.',
  features: ['All Light features', 'Read-only HTTP API', 'Fallback data source', 'Request serving'],
  recommended: true,
};

function PlaceholderMedia() {
  return (
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
  );
}

export function NodeTypesInfoCards() {
  return (
    <section id="node-types-info" className="mb-6">
      <SectionHeader title="Light Node & Mirror Node" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={CARD_CLASS}>
          <PlaceholderMedia />
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">{LIGHT_NODE.name}</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">{LIGHT_NODE.description}</p>
          <ul className="space-y-1.5 mb-4">
            {LIGHT_NODE.features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                <span className="text-cyan-500">•</span>
                {f}
              </li>
            ))}
          </ul>
          <p className="pt-3 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400">
            Earn Hub Points while online · redeem on Rewards
          </p>
        </div>
        <div className={`${CARD_CLASS} border-cyan-500/50`}>
          <PlaceholderMedia />
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{MIRROR_NODE.name}</h3>
            {MIRROR_NODE.recommended && (
              <span className="text-[10px] px-2 py-0.5 bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 rounded-full font-bold uppercase tracking-wider">
                Recommended
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">{MIRROR_NODE.description}</p>
          <ul className="space-y-1.5 mb-4">
            {MIRROR_NODE.features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                <span className="text-cyan-500">•</span>
                {f}
              </li>
            ))}
          </ul>
          <p className="pt-3 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400">
            Earn Hub Points while online · redeem on Rewards
          </p>
        </div>
      </div>
    </section>
  );
}
