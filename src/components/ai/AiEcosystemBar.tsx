'use client';

export function AiEcosystemBar() {
  const items = [
    {
      title: 'Built on Kaspa L1 BlockDAG',
      description: 'Ultra-fast, secure, and decentralized settlement for agent actions.',
      icon: (
        <svg className="h-6 w-6 text-cyan-600 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      title: 'Token utility',
      description: 'Use KAS, KREX, and ARIA for access, governance, and rewards.',
      icon: (
        <div className="flex gap-1">
          {['KAS', 'KREX', 'ARIA'].map((t) => (
            <span key={t} className="rounded px-1.5 py-0.5 text-[9px] font-black bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              {t}
            </span>
          ))}
        </div>
      ),
    },
    {
      title: 'Programmability on the horizon',
      description: 'Preparing native L1 scripts for agent covenants and on-chain workflows.',
      icon: (
        <svg className="h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
    },
  ];

  return (
    <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 p-4 sm:p-6">
      {items.map((item) => (
        <div key={item.title} className="flex gap-4 items-start p-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
            {item.icon}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">{item.title}</h3>
            <p className="text-xs leading-relaxed text-zinc-500">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
