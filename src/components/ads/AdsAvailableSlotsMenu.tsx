'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AD_SLOTS, priceKasForDays } from '@/lib/ads/slots';
import { AD_SLOT_PLACEMENT_LINKS } from '@/lib/ads/placementLinks';
import { countActiveForSlot, firstFreeSlotIndex } from '@/lib/ads/registryUtils';
import { useAdsRegistryContext } from '@/components/ads/AdsRegistryProvider';
import type { AdSlotConfig, AdSlotId } from '@/lib/ads/types';

export function AdsAvailableSlotsMenu() {
  const { ads } = useAdsRegistryContext();
  const router = useRouter();
  const [slotId, setSlotId] = useState<AdSlotId>(AD_SLOTS[0]?.id ?? 'HALO_DAPPS_RIGHT');

  const placementHref = (id: AdSlotId) =>
    AD_SLOT_PLACEMENT_LINKS.find((p) => p.slotId === id)?.href ?? '/ads/overview';

  const slot = useMemo(() => AD_SLOTS.find((s) => s.id === slotId) as AdSlotConfig | undefined, [slotId]);

  const used = slot ? countActiveForSlot(ads, slot.id) : 0;
  const free = slot ? Math.max(0, slot.maxAds - used) : 0;
  const firstIdx = slot ? firstFreeSlotIndex(ads, slot.id, slot.maxAds) : 0;
  const sample7d = slot ? priceKasForDays(slot, 7) : 0;
  const place = slot ? AD_SLOT_PLACEMENT_LINKS.find((p) => p.slotId === slot.id) : undefined;

  const buySlot = () => {
    if (!slot || free <= 0) return;
    const q = new URLSearchParams({ slot: slot.id, cell: String(firstIdx) });
    router.push(`/ads?${q.toString()}`);
  };

  if (!slot) return null;

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="ads-inventory-slot" className="sr-only">
          Ad slot
        </label>
        <div className="relative">
          <select
            id="ads-inventory-slot"
            value={slotId}
            onChange={(e) => setSlotId(e.target.value as AdSlotId)}
            className="k-control-btn w-full h-11 pl-3 pr-10 appearance-none cursor-pointer text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-sm"
          >
            {AD_SLOTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <svg
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-gradient-to-b from-white to-zinc-50/80 dark:from-zinc-900 dark:to-zinc-950/80 p-4 shadow-sm space-y-4">
        <p className="text-sm leading-snug text-zinc-600 dark:text-zinc-400">{place?.placement ?? slot.id}</p>

        <div className="rounded-lg bg-[#02abb8]/10 dark:bg-[#02abb8]/15 border border-[#02abb8]/25 px-3 py-3">
          <p className="text-xs font-bold uppercase tracking-wide text-[#02abb8] mb-1">Price</p>
          <p className="text-2xl font-black text-zinc-900 dark:text-white tabular-nums">
            {slot.pricePerDay}
            <span className="text-base font-bold text-zinc-600 dark:text-zinc-400 ml-1.5">KAS</span>
            <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400"> / day</span>
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
            Example: 7 days is about{' '}
            <span className="font-bold text-zinc-800 dark:text-zinc-200 tabular-nums">{sample7d} KAS</span> total.
          </p>
        </div>

        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          <span className="font-bold text-lg tabular-nums text-zinc-900 dark:text-white">{free}</span>
          <span> of {slot.maxAds} spots open</span>
        </p>

        <div className="flex flex-col gap-2 pt-1">
          {free > 0 ? (
            <button
              type="button"
              onClick={buySlot}
              className="w-full py-3 px-4 rounded-xl text-sm font-bold bg-gradient-to-r from-cyan-500 to-[#02abb8] text-white shadow-md hover:from-cyan-600 hover:to-[#029ca8] transition-colors"
            >
              Buy a slot
            </button>
          ) : (
            <p className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-center text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80">
              Fully booked
            </p>
          )}
          <Link
            href={placementHref(slot.id)}
            className="w-full py-3 px-4 rounded-xl text-sm font-bold text-center border-2 border-zinc-200 dark:border-zinc-600 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            View placement
          </Link>
        </div>
      </div>
    </div>
  );
}
