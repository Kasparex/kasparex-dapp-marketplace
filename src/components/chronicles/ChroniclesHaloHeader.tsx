'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { HubHaloHeader } from '@/components/hub/HubHaloHeader';
import { AdSlider } from '@/components/ads/AdSlider';

export function ChroniclesHaloHeader({
  kicker = 'Lore codex',
  title = "Krex's Chronicles",
  titleAccent,
  subtitle = 'Wiki, story, and CMS-ready lore for Kaspaland: the narrative backbone of Kasparex.',
  showHaloAd = true,
  badgeVariant = 'pulse' as 'pulse' | 'plain',
  actions,
  showDefaultActions = false,
}: {
  kicker?: string;
  title?: string;
  /** Word or phrase in title rendered with gradient accent (defaults to last word of title). */
  titleAccent?: string;
  subtitle?: string;
  showHaloAd?: boolean;
  badgeVariant?: 'pulse' | 'plain';
  actions?: ReactNode;
  /** When true and no custom actions, show Create + Vault shortcuts. */
  showDefaultActions?: boolean;
}) {
  const accent = titleAccent ?? title.split(' ').slice(-1)[0] ?? title;
  const titlePrefix = title.endsWith(accent) ? title.slice(0, title.length - accent.length).trimEnd() : title;
  const titleNode: ReactNode =
    title.endsWith(accent) && accent.length > 0 ? (
      <>
        {titlePrefix ? `${titlePrefix} ` : null}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-700 via-purple-600 to-fuchsia-600 dark:from-violet-300 dark:via-purple-300 dark:to-fuchsia-400">
          {accent}
        </span>
      </>
    ) : (
      title
    );

  const defaultActions = showDefaultActions ? (
    <>
      <Link href="/chronicles/center?tab=create" className="k-control-btn !border-violet-500/35 !text-violet-800 dark:!text-violet-200">
        Create lore
      </Link>
      <Link href="/chronicles/center" className="k-control-btn">
        Chronicles Center
      </Link>
      <Link href="/chronicles/dashboard" className="k-control-btn">
        Vault & unlocks
      </Link>
    </>
  ) : null;

  return (
    <HubHaloHeader
      id="ad-slot-chronicles-halo"
      theme="violet"
      badgeLabel={kicker}
      badgeVariant={badgeVariant}
      title={titleNode}
      subtitle={subtitle}
      actions={actions ?? defaultActions ?? undefined}
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
