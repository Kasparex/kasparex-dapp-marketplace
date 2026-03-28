'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { EmptyVeinSlotFrame, EmptyVeinSlotPlusIcon } from '@/components/game/EmptyVeinSlotFrame';
import { useAdsRegistryContext } from '@/components/ads/AdsRegistryProvider';
import { getSlotConfig } from '@/lib/ads/slots';
import { filterActiveAdsForSlot } from '@/lib/ads/registryUtils';
import type { AdEntry, AdSlotId } from '@/lib/ads/types';
import { CreateAdWizard } from '@/components/ads/CreateAdWizard';

export type AdPlacementVariant = 'halo' | 'footer' | 'sidebar';

const gridClass: Record<AdPlacementVariant, string> = {
  halo: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3',
  footer: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3',
  sidebar: 'flex flex-col gap-3',
};

function frameForVariant(v: AdPlacementVariant): string {
  if (v === 'footer') return 'aspect-[32/9] min-h-[72px] max-h-[88px] p-3';
  if (v === 'sidebar') return 'aspect-[3/2] min-h-[100px] p-4 w-full';
  return 'aspect-square min-w-0 max-w-[220px] mx-auto w-full p-4';
}

interface AdPlacementGridProps {
  slotId: AdSlotId;
  variant: AdPlacementVariant;
  maxCellsShown?: number;
}

export function AdPlacementGrid({ slotId, variant, maxCellsShown }: AdPlacementGridProps) {
  const { ads, refresh } = useAdsRegistryContext();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardSlot, setWizardSlot] = useState<AdSlotId | null>(null);
  const [wizardIndex, setWizardIndex] = useState(0);

  const cfg = getSlotConfig(slotId);
  const maxAds = cfg?.maxAds ?? 1;
  const limit = Math.min(maxCellsShown ?? maxAds, maxAds);

  const slotAds = useMemo(() => filterActiveAdsForSlot(ads, slotId), [ads, slotId]);

  const byIndex = useMemo(() => {
    const m = new Map<number, AdEntry>();
    for (const a of slotAds) {
      const i = a.slotIndex ?? 0;
      if (!m.has(i)) m.set(i, a);
    }
    return m;
  }, [slotAds]);

  const openWizard = (cellIndex: number) => {
    const used = new Set(slotAds.map((a) => a.slotIndex ?? 0));
    if (used.size >= maxAds) return;
    let idx = cellIndex;
    if (used.has(idx)) {
      const firstFree = [...Array(maxAds).keys()].find((i) => !used.has(i));
      if (firstFree === undefined) return;
      idx = firstFree;
    }
    setWizardSlot(slotId);
    setWizardIndex(idx);
    setWizardOpen(true);
  };

  const full = slotAds.length >= maxAds;
  const cells = Array.from({ length: limit }, (_, i) => i);

  return (
    <>
      <div className={gridClass[variant]}>
        {cells.map((cellIndex) => {
          const ad = byIndex.get(cellIndex);
          if (ad) {
            return <FilledAdCell key={cellIndex} ad={ad} variant={variant} />;
          }
          return (
            <EmptyVeinSlotFrame
              key={cellIndex}
              disabled={full}
              onClick={() => !full && openWizard(cellIndex)}
              frameClassName={frameForVariant(variant)}
            >
              <div className="flex flex-col items-center gap-2 text-center relative z-[1]">
                <EmptyVeinSlotPlusIcon />
                <div>
                  <h3 className="font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide text-xs sm:text-sm">
                    Ad slot
                  </h3>
                  <p className="text-zinc-500 dark:text-zinc-400 text-[11px] sm:text-xs mt-0.5 px-1">
                    {full ? 'Slot full' : 'Your campaign'}
                  </p>
                </div>
              </div>
            </EmptyVeinSlotFrame>
          );
        })}
      </div>
      {wizardSlot ? (
        <CreateAdWizard
          isOpen={wizardOpen}
          onClose={() => {
            setWizardOpen(false);
            setWizardSlot(null);
          }}
          onSuccess={() => void refresh()}
          initialSlotId={wizardSlot}
          initialSlotIndex={wizardIndex}
        />
      ) : null}
    </>
  );
}

function FilledAdCell({ ad, variant }: { ad: AdEntry; variant: AdPlacementVariant }) {
  const cls =
    variant === 'footer'
      ? 'relative block w-full aspect-[32/9] min-h-[72px] max-h-[88px] rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 ring-2 ring-emerald-500/20'
      : variant === 'sidebar'
        ? 'relative block w-full aspect-[3/2] rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 ring-2 ring-emerald-500/20'
        : 'relative block w-full aspect-square max-w-[220px] mx-auto rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 ring-2 ring-emerald-500/20';

  return (
    <Link href={ad.link} target="_blank" rel="noopener noreferrer sponsored" className={cls} title={ad.title}>
      <Image src={ad.imageUrl} alt={ad.title} fill className="object-cover" sizes="240px" unoptimized />
    </Link>
  );
}
