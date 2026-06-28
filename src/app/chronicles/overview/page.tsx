import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChroniclesHaloHeader } from '@/components/chronicles/ChroniclesHaloHeader';
import { ChroniclesMarkdown } from '@/components/chronicles/ChroniclesMarkdown';
import { DiamondVeinsCallout } from '@/components/chronicles/DiamondVeinsCallout';
import { ChronicleFeaturedVisual, ChronicleThumb } from '@/components/chronicles/ChronicleFeaturedVisual';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { getOverview, getFragments, getChapterSummaries } from '@/lib/chronicles/loaders';
import { ChroniclesAdSlot } from '@/components/chronicles/ChroniclesAdSlot';
import { KxListingCard, KxListingCardBody } from '@/components/kx/KxListingCard';
import { CHRONICLES_TEASER } from '@/lib/chronicles/typography';

export default function ChroniclesOverviewPage() {
  const overview = getOverview();
  const fragments = getFragments();
  const chapters = getChapterSummaries();

  const timelineChapters = chapters
    .slice()
    .sort((a, b) => b.number - a.number)
    .slice(0, 5);

  return (
    <div>
      <ChroniclesHaloHeader titleAccent="Chronicles" showDefaultActions />

      <div className="grid lg:grid-cols-3 gap-10 xl:gap-12">
        <div className="lg:col-span-2 space-y-10">
          <ChronicleFeaturedVisual imageUrl={overview.featuredImageUrl} alt={overview.title} badge="Overview" />
          <div>
            <DAppSectionHeader title={overview.title} className="mb-4" />
            <p className={`${CHRONICLES_TEASER} mb-8`}>{overview.tagline}</p>
            <ChroniclesMarkdown markdown={overview.bodyMarkdown} />
          </div>
          <div className="pt-4">
            <DiamondVeinsCallout />
          </div>
        </div>

        <aside className="space-y-10">
          <div>
            <DAppSectionHeader title="Story timeline" className="mb-5" />
            <ol className="space-y-4">
              {timelineChapters.map((c) => {
                const isCurrent = c.timeline === 'current';
                const isLatest = timelineChapters[0]?.slug === c.slug;
                const isPremium = c.access?.tier === 'premium';
                const isHighlighted = isCurrent || isLatest || isPremium;
                return (
                  <li key={c.slug}>
                    <KxListingCard
                      href={`/chronicles/chapters/${c.slug}`}
                      accent="chronicles"
                      className={isHighlighted ? 'border-cyan-500/40 bg-cyan-500/5 dark:bg-cyan-950/30' : undefined}
                    >
                      <div className="flex gap-4 p-4">
                        <ChronicleThumb imageUrl={c.featuredImageUrl} alt="" className="w-20 h-20 shrink-0 rounded-xl" />
                        <KxListingCardBody className="p-0 min-w-0">
                          <span className="text-xs font-mono text-zinc-400">
                            Chapter {c.number}
                            {isPremium ? ' · Premium' : ''}
                            {isLatest ? ' · Latest' : ''}
                          </span>
                          <span className="block font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-[#02abb8] text-base leading-snug">
                            {c.title}
                          </span>
                          <span className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 mt-1 leading-relaxed">{c.teaser}</span>
                        </KxListingCardBody>
                      </div>
                    </KxListingCard>
                  </li>
                );
              })}
            </ol>
            <Link href="/chronicles/chapters" className="inline-block mt-5 text-base font-bold text-[#02abb8] hover:underline">
              All chapters →
            </Link>
          </div>

          <div>
            <DAppSectionHeader title="Codex fragments" className="mb-5" />
            <div className="space-y-5">
              {fragments.map((f) => (
                <KxListingCard key={f.id} accent="chronicles">
                  <KxListingCardBody>
                    <p className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-3">{f.title}</p>
                    <ChroniclesMarkdown markdown={f.bodyMarkdown} />
                  </KxListingCardBody>
                </KxListingCard>
              ))}
            </div>
          </div>

          <KxListingCard accent="chronicles">
            <KxListingCardBody>
              <DAppSectionHeader title="Explore" className="mb-4" />
              <ul className="space-y-3 text-base font-semibold">
                <li>
                  <Link href="/chronicles/characters" className="text-[#02abb8] hover:underline">
                    Characters & factions
                  </Link>
                </li>
                <li>
                  <Link href="/chronicles/locations" className="text-[#02abb8] hover:underline">
                    Locations
                  </Link>
                </li>
                <li>
                  <Link href="/chronicles/vehicles" className="text-[#02abb8] hover:underline">
                    Vehicles & tech
                  </Link>
                </li>
                <li>
                  <Link href="/chronicles/center" className="text-[#02abb8] hover:underline">
                    Chronicles Center
                  </Link>
                </li>
              </ul>
            </KxListingCardBody>
          </KxListingCard>

          <ChroniclesAdSlot layout="rail" />
        </aside>
      </div>
    </div>
  );
}
