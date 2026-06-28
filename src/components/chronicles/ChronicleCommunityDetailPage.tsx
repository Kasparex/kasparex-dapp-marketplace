'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChroniclesMarkdown } from '@/components/chronicles/ChroniclesMarkdown';
import { ChronicleFeaturedVisual } from '@/components/chronicles/ChronicleFeaturedVisual';
import { ChronicleCategoryKicker } from '@/components/chronicles/ChronicleCategoryKicker';
import { ChroniclesCommunityBadge } from '@/components/chronicles/ChroniclesCommunityBadge';
import { CHRONICLES_CONTENT_KIND_LABELS, type ChroniclesContentKind } from '@/lib/chronicles/communitySubmissions';
import { useChroniclesCommunitySubmissions } from '@/hooks/useChroniclesCommunitySubmissions';
import { CHRONICLES_TEASER } from '@/lib/chronicles/typography';

const BACK_HREF: Record<ChroniclesContentKind, string> = {
  chapter: '/chronicles/chapters',
  article: '/chronicles/articles',
  character: '/chronicles/characters',
  location: '/chronicles/locations',
  vehicle: '/chronicles/vehicles',
};

export function ChronicleCommunityDetailPage({
  slug,
  kind,
}: {
  slug: string;
  kind: ChroniclesContentKind;
}) {
  const { items, refresh } = useChroniclesCommunitySubmissions({ kind });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    refresh();
    setReady(true);
  }, [refresh, slug]);

  const item = items.find((i) => i.slug === slug);
  const backLabel =
    kind === 'vehicle' ? 'Vehicles & tech' : kind === 'article' ? 'Articles' : `${CHRONICLES_CONTENT_KIND_LABELS[kind]}s`;

  if (!ready) {
    return <p className="text-sm text-zinc-500">Loading community lore…</p>;
  }

  if (!item) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="kx-body">Community entry not found.</p>
        <Link href={BACK_HREF[kind]} className="text-sm font-bold text-[#02abb8] hover:underline">
          Back to {backLabel}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        href={BACK_HREF[kind]}
        className="text-sm font-semibold text-zinc-500 hover:text-[#02abb8] mb-6 inline-block"
      >
        ← {backLabel}
      </Link>

      <ChronicleFeaturedVisual imageUrl={item.featuredImageUrl} alt={item.title} badge={CHRONICLES_CONTENT_KIND_LABELS[kind]} />
      <div className="mb-5 flex flex-wrap items-center gap-2.5">
        <ChronicleCategoryKicker className="!mb-0">{CHRONICLES_CONTENT_KIND_LABELS[kind]}</ChronicleCategoryKicker>
        <ChroniclesCommunityBadge />
      </div>
      <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-zinc-100">{item.title}</h1>
      <p className={`${CHRONICLES_TEASER} mt-4`}>{item.summary}</p>

      <div className="mt-10">
        <ChroniclesMarkdown markdown={item.bodyMarkdown} />
      </div>
    </div>
  );
}
