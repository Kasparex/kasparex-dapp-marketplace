import Link from 'next/link';

export function DiamondVeinsCallout({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-emerald-500/25 bg-emerald-500/5 dark:bg-emerald-500/10 p-5 ${className}`.trim()}
    >
      <p className="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2">
        Also in Kasparex
      </p>
      <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-3">
        Mine Krex Diamonds beneath Kaspaland in the{' '}
        <strong className="text-zinc-900 dark:text-zinc-100">Diamond Veins</strong> game — same world, underground
        layer.
      </p>
      <Link
        href="/games/diamond-veins"
        className="inline-flex items-center gap-2 text-sm font-bold text-[#02abb8] hover:underline"
      >
        Play Diamond Veins
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </Link>
    </div>
  );
}
