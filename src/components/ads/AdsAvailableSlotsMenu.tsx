'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AD_SLOTS, priceKasForDays } from '@/lib/ads/slots';
import { AD_SLOT_PLACEMENT_LINKS } from '@/lib/ads/placementLinks';
import { countActiveForSlot, firstFreeSlotIndex } from '@/lib/ads/registryUtils';
import { useAdsRegistryContext } from '@/components/ads/AdsRegistryProvider';
import type { AdSlotId } from '@/lib/ads/types';

export function AdsAvailableSlotsMenu() {
  const { ads } = useAdsRegistryContext();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const placementHref = (slotId: AdSlotId) =>
    AD_SLOT_PLACEMENT_LINKS.find((p) => p.slotId === slotId)?.href ?? '/ads/overview';

  const buySlot = (slotId: AdSlotId, cell: number) => {
    setOpen(false);
    const q = new URLSearchParams({ slot: slotId, cell: String(cell) });
    router.push(`/ads?${q.toString()}`);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="k-sidebar-item group w-full text-left flex items-center gap-2 py-2.5"
      >
        <svg className="w-4 h-4 flex-shrink-0 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <span className="text-[11px] font-bold uppercase tracking-wider flex-1 min-w-0 truncate">
          Available slots
        </span>
        <svg
          className={`w-4 h-4 flex-shrink-0 text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="mt-1 mb-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/90 shadow-lg overflow-hidden max-h-[min(70vh,520px)] overflow-y-auto">
          {AD_SLOTS.map((slot) => {
            const used = countActiveForSlot(ads, slot.id);
            const free = Math.max(0, slot.maxAds - used);
            const firstIdx = firstFreeSlotIndex(ads, slot.id, slot.maxAds);
            const sample7d = priceKasForDays(slot, 7);
            const place = AD_SLOT_PLACEMENT_LINKS.find((p) => p.slotId === slot.id);
            return (
              <div
                key={slot.id}
                className="p-3 border-b border-zinc-200/80 dark:border-zinc-700/80 last:border-b-0"
              >
                <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-900 dark:text-zinc-100">
                  {slot.label}
                </p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 leading-snug">
                  {place?.placement ?? slot.id}
                </p>
                <ul className="mt-2 space-y-1 text-[11px] text-zinc-600 dark:text-zinc-400">
                  <li>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{slot.pricePerDay} KAS</span>
                    {' / day'}
                  </li>
                  <li className="text-zinc-500">Example: 7 days is about {sample7d} KAS total.</li>
                  <li>
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">{free}</span>
                    {` of ${slot.maxAds} spots open`}
                  </li>
                </ul>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {free > 0 ? (
                    <button
                      type="button"
                      onClick={() => buySlot(slot.id, firstIdx)}
                      className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-gradient-to-r from-cyan-500 to-[#02abb8] text-white hover:from-cyan-600 hover:to-[#029ca8]"
                    >
                      Buy a slot
                    </button>
                  ) : (
                    <span className="text-[10px] font-medium text-zinc-500 py-1.5">Fully booked</span>
                  )}
                  <Link
                    href={placementHref(slot.id)}
                    onClick={() => setOpen(false)}
                    className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border border-zinc-200 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800"
                  >
                    View placement
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
