import Link from 'next/link';
import type { KREXTier, NFTStatus } from '@/lib/rewards/types';
import { VAULT_MAX_COMBINED_DISCOUNT_PERCENT } from '@/lib/chronicles/vault/constants';
import { AdSlider } from '@/components/ads/AdSlider';

function tierLabel(t: KREXTier): string {
  return t.replace('Tier', 'Tier ');
}

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
  const hasNft = !!(nft?.hasKREXPRIME || nft?.hasPIXELKREX);
  const hasDiamond = !!(nft?.hasDiamondKREXPRIME || nft?.hasDiamondPIXELKREX);

  return (
    <aside className="space-y-6 lg:sticky lg:top-6 self-start text-[15px] sm:text-base">
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-900/55 p-5 sm:p-6">
        <h2 className="text-sm font-black uppercase tracking-widest text-[#02abb8] mb-3">Your holder perks</h2>
        <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
          KREX balance tiers and KREX / PIXEL NFT holdings reduce vault prices on-chain. Discounts stack up to{' '}
          {VAULT_MAX_COMBINED_DISCOUNT_PERCENT}%.
        </p>
        <dl className="space-y-3 text-zinc-800 dark:text-zinc-200">
          <div>
            <dt className="text-xs font-bold uppercase tracking-wider text-zinc-500">KREX tier</dt>
            <dd className="font-semibold mt-0.5">
              {isKrexLoading ? 'Loading…' : tierLabel(krexTier)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-wider text-zinc-500">NFT tier</dt>
            <dd className="font-semibold mt-0.5">
              {isNftLoading
                ? 'Loading…'
                : nft?.hasRarestNFT
                  ? 'Rarest (max perk)'
                  : hasDiamond
                    ? 'Diamond KREX / PIXEL'
                    : hasNft
                      ? 'KREXPRIME / PIXELKREX'
                      : 'No qualifying NFT on this Kaspa address'}
            </dd>
          </div>
        </dl>
      </div>

      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-900/55 p-5 sm:p-6">
        <h2 className="text-sm font-black uppercase tracking-widest text-[#02abb8] mb-3">How payments work</h2>
        <ol className="list-decimal pl-5 space-y-2 text-zinc-600 dark:text-zinc-400 leading-relaxed">
          <li>Connect KasWare and choose an item below.</li>
          <li>Pay the shown KAS amount to the treasury with the encoded payload (your wallet adds it).</li>
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

      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-900/55 p-5 sm:p-6">
        <h2 className="text-sm font-black uppercase tracking-widest text-[#02abb8] mb-3">Ad slots</h2>
        <div className="flex items-center justify-center min-h-[200px]">
          <AdSlider slotId="HALO_CHRONICLES_RIGHT" />
        </div>
      </div>
    </aside>
  );
}
