'use client';

const CARD_CLASS = 'rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900 p-6';

const LIGHT_NODE = {
  name: 'Light Node',
  description: 'Pins IPFS/Storacha CIDs, caches dApp metadata locally, and periodically syncs with the Kasparex API. Ideal for regular community members.',
  multiplier: '4x',
  feeReduction: '0.1%',
  features: ['Pins CIDs', 'Caches metadata', 'Syncs with API', 'Low resource use'],
};

const MIRROR_NODE = {
  name: 'Mirror Node',
  description: 'Everything Light Node does, plus exposes a read-only HTTP API that can serve as a fallback data source. Ideal for power users and partners.',
  multiplier: '5x',
  feeReduction: '0.2%',
  features: ['All Light features', 'Read-only HTTP API', 'Fallback data source', 'Request serving'],
  recommended: true,
};

export function NodeTypesInfoCards() {
  return (
    <section id="node-types-info" className="mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-1.5 h-6 bg-cyan-500 rounded-full" />
        <h2 className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
          Light Node & Mirror Node
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={CARD_CLASS}>
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
          <div className="flex flex-wrap gap-4 pt-3 border-t border-zinc-200 dark:border-zinc-800 text-sm">
            <span><span className="text-zinc-500 dark:text-zinc-500">Multiplier</span> <strong className="text-cyan-600 dark:text-cyan-400">{LIGHT_NODE.multiplier}</strong></span>
            <span><span className="text-zinc-500 dark:text-zinc-500">Fee reduction</span> <strong className="text-zinc-900 dark:text-zinc-100">{LIGHT_NODE.feeReduction}</strong></span>
          </div>
        </div>
        <div className={`${CARD_CLASS} border-cyan-500/50`}>
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
          <div className="flex flex-wrap gap-4 pt-3 border-t border-zinc-200 dark:border-zinc-800 text-sm">
            <span><span className="text-zinc-500 dark:text-zinc-500">Multiplier</span> <strong className="text-cyan-600 dark:text-cyan-400">{MIRROR_NODE.multiplier}</strong></span>
            <span><span className="text-zinc-500 dark:text-zinc-500">Fee reduction</span> <strong className="text-zinc-900 dark:text-zinc-100">{MIRROR_NODE.feeReduction}</strong></span>
          </div>
        </div>
      </div>
    </section>
  );
}
