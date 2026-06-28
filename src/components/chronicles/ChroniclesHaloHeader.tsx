'use client';

import type { ReactNode } from 'react';
import { HubHaloHeader } from '@/components/hub/HubHaloHeader';
import { AdSlider } from '@/components/ads/AdSlider';

export function ChroniclesHaloHeader({
  kicker = 'Lore codex',
  title = "Krex's Chronicles",
  titleAccent,
  subtitle = 'Wiki, story, and CMS-ready lore for Kaspaland: the narrative backbone of Kasparex.',
  showHaloAd = true,
  badgeVariant = 'pulse' as 'pulse' | 'plain',
}: {
  kicker?: string;
  title?: string;
  /** Word or phrase in title rendered with gradient accent (defaults to last word of title). */
  titleAccent?: string;
  subtitle?: string;
  showHaloAd?: boolean;
  badgeVariant?: 'pulse' | 'plain';
}) {
  const accent = titleAccent ?? title.split(' ').slice(-1)[0] ?? title;
  const titlePrefix = title.endsWith(accent) ? title.slice(0, title.length - accent.length).trimEnd() : title;
  const titleNode: ReactNode =
    title.endsWith(accent) && accent.length > 0 ? (
      <>
        {titlePrefix ? `${titlePrefix} ` : null}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-700 via-cyan-600 to-teal-600 dark:from-cyan-300 dark:via-cyan-400 dark:to-teal-400">
          {accent}
        </span>
      </>
    ) : (
      title
    );

  return (
    <HubHaloHeader
      id="ad-slot-chronicles-halo"
      badgeLabel={kicker}
      badgeVariant={badgeVariant}
      title={titleNode}
      subtitle={subtitle}
      rightSlot={
        showHaloAd ? (
          <div className="hidden lg:flex items-center justify-center flex-shrink-0 relative w-[280px] min-h-[200px] scroll-mt-24">
            <AdSlider slotId="HALO_CHRONICLES_RIGHT" />
          </div>
        ) : undefined
      }
    />
  );
}
