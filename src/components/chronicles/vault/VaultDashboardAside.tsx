import Link from 'next/link';
import type { KREXTier, NFTStatus } from '@/lib/rewards/types';

export function VaultDashboardAside({
  krexTier,
  nft,
  isKrexLoading,
  isNftLoading,
}: {
  krexTier: KREXTier;
  nft: NFTStatus | null;
  isKrexLoading: boolean;
  isNftLoading: boolean;
}) {
  return (
    <aside className="space-y-6 lg:sticky lg:top-6 self-start text-[15px] sm:text-base">
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-900/55 p-5 sm:p-6">
        <h2 className="text-sm font-black uppercase tracking-widest text-[#02abb8] mb-3">Your holder perks</h2>
        <dl className="space-y-2 text-zinc-800 dark:text-zinc-200">
          <div>
            <dt className="text-xs font-bold uppercase tracking-wider text-zinc-500">KREX tier</dt>
            <dd className="font-semibold mt-0.5">{isKrexLoading ? 'Loading…' : krexTier.replace('Tier', 'Tier ')}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-wider text-zinc-500">NFT tier</dt>
            <dd className="font-semibold mt-0.5">PIXELKREX / KREXPRIME</dd>
          </div>
        </dl>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-4 leading-relaxed">The exact price is shown on each offer card.</p>
      </div>

      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-900/55 p-5 sm:p-6">
        <h2 className="text-sm font-black uppercase tracking-widest text-[#02abb8] mb-3">How payments work</h2>
        <ol className="list-decimal pl-5 space-y-2 text-zinc-600 dark:text-zinc-400 leading-relaxed">
          <li>Connect a wallet and choose an item below.</li>
          <li>Send the shown KAS amount to the treasury address with the encoded payload (your wallet adds it).</li>
          <li>We verify the transaction against the catalog; your unlock is saved in this browser.</li>
        </ol>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-4 leading-relaxed">
          Use the same device/browser to keep unlocks, or unlock again from a new profile (payment is on-chain).
        </p>
      </div>

      <div className="rounded-2xl border border-cyan-500/25 bg-cyan-500/5 dark:bg-cyan-950/30 p-5 sm:p-6">
        <h2 className="text-sm font-black uppercase tracking-widest text-[#02abb8] mb-3">Browse lore</h2>
        <ul className="space-y-2">
          <li>
            <Link href="/chronicles/chapters" className="font-semibold text-[#02abb8] hover:underline">
              All chapters
            </Link>
          </li>
          <li>
            <Link href="/chronicles/characters" className="font-semibold text-[#02abb8] hover:underline">
              Characters
            </Link>
          </li>
          <li>
            <Link href="/chronicles" className="font-semibold text-[#02abb8] hover:underline">
              Chronicles overview
            </Link>
          </li>
        </ul>
      </div>
    </aside>
  );
}
