import Link from 'next/link';
import { KxBadge } from '@/components/ui/KxBadge';
import { KX_TEXT_BODY_SM } from '@/lib/ui/kxTypography';

export function MinecoreCallout({ className = '' }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-emerald-500/35 bg-gradient-to-br from-emerald-500/12 via-teal-500/8 to-cyan-500/10 dark:from-emerald-950/50 dark:via-teal-950/40 dark:to-cyan-950/30 p-5 sm:p-6 shadow-[0_0_24px_rgba(16,185,129,0.12)] ${className}`.trim()}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-400/15 blur-2xl"
        aria-hidden
      />
      <div className="relative">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <KxBadge variant="reward" icon={
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }>
            Official game link
          </KxBadge>
          <KxBadge variant="teal">Krex&apos;s Chronicles × Minecore</KxBadge>
        </div>
        <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 mb-2">Minecore</h3>
        <p className={`${KX_TEXT_BODY_SM} text-zinc-700 dark:text-zinc-300 mb-4`}>
          Beneath the neon spine of Kaspaland, unstable diamond veins pulse with raw network energy.{' '}
          <strong className="text-emerald-800 dark:text-emerald-200">Minecore</strong> is Krex&apos;s industrial layer:
          crewed plants, grid load, refinement, and the force that keeps the metropolis powered.
        </p>
        <Link
          href="/games/minecore"
          className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-600 px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow-sm transition-colors hover:bg-emerald-500 dark:bg-emerald-700 dark:hover:bg-emerald-600"
        >
          Play Minecore
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
