import Link from 'next/link';
import type { KREXTier, NFTStatus } from '@/lib/rewards/types';
import { CHRONICLES_PANEL, CHRONICLES_PANEL_BODY, CHRONICLES_PANEL_LABEL } from '@/lib/chronicles/typography';

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
    <aside className="space-y-4 lg:sticky lg:top-6 self-start">
      <div className={`${CHRONICLES_PANEL} p-4`}>
        <h2 className={`${CHRONICLES_PANEL_LABEL} mb-3`}>Your holder perks</h2>
        <dl className="space-y-2 text-base leading-relaxed">
          <div>
            <dt className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-white/70">KREX tier</dt>
            <dd className="font-semibold mt-0.5 text-zinc-900 dark:text-white">
              {isKrexLoading ? 'Loading…' : krexTier.replace('Tier', 'Tier ')}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-white/70">NFT tier</dt>
            <dd className="font-semibold mt-0.5 text-zinc-900 dark:text-white">PIXELKREX / KREXPRIME</dd>
          </div>
        </dl>
        <p className={`${CHRONICLES_PANEL_BODY} text-sm mt-4`}>The exact price is shown on each offer card.</p>
      </div>

      <div className={`${CHRONICLES_PANEL} p-4`}>
        <h2 className={`${CHRONICLES_PANEL_LABEL} mb-3`}>How payments work</h2>
        <ol className={`list-decimal pl-5 space-y-2 ${CHRONICLES_PANEL_BODY}`}>
          <li>Connect a wallet and choose an item below.</li>
          <li>Send the shown KAS amount to the treasury address with the encoded payload (your wallet adds it).</li>
          <li>We verify the transaction against the catalog; your unlock is saved in this browser.</li>
        </ol>
        <p className={`${CHRONICLES_PANEL_BODY} text-sm mt-4`}>
          Use the same device/browser to keep unlocks, or unlock again from a new profile (payment is on-chain).
        </p>
      </div>

      <div className={`${CHRONICLES_PANEL} border-l-4 border-l-cyan-500/50 p-4`}>
        <h2 className={`${CHRONICLES_PANEL_LABEL} mb-3`}>Browse lore</h2>
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
            <Link href="/chronicles/overview" className="font-semibold text-[#02abb8] hover:underline">
              Chronicles overview
            </Link>
          </li>
        </ul>
      </div>
    </aside>
  );
}
