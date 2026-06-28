import Link from 'next/link';
import { CHRONICLES_PANEL, CHRONICLES_PANEL_BODY, CHRONICLES_PANEL_LABEL } from '@/lib/chronicles/typography';

export function DiamondVeinsCallout({ className = '' }: { className?: string }) {
  return (
    <div className={`${CHRONICLES_PANEL} border-l-4 border-l-cyan-500/50 p-4 ${className}`.trim()}>
      <p className={`${CHRONICLES_PANEL_LABEL} mb-2`}>Also in Kasparex</p>
      <p className={`${CHRONICLES_PANEL_BODY} mb-3`}>
        Mine Krex Diamonds beneath Kaspaland in the{' '}
        <strong className="text-zinc-900 dark:text-white">Diamond Veins</strong> game: same world, underground layer.
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
