import { Metadata } from 'next';
import Link from 'next/link';
import { ChronicleCommunityDetailPage } from '@/components/chronicles/ChronicleCommunityDetailPage';
import { ChroniclesMarkdown } from '@/components/chronicles/ChroniclesMarkdown';
import { MinecoreCallout } from '@/components/chronicles/MinecoreCallout';
import { KxBadge } from '@/components/ui/KxBadge';
import { chronicleTagBadgeVariant } from '@/lib/chronicles/chronicleTagBadge';
import { ChronicleFeaturedVisual } from '@/components/chronicles/ChronicleFeaturedVisual';
import { ChronicleCategoryKicker } from '@/components/chronicles/ChronicleCategoryKicker';
import { ChronicleArticleAside } from '@/components/chronicles/ChronicleArticleAside';
import {
  getLocationBySlug,
  getAllLocationSlugs,
  getCharacterBySlug,
  getChapterSummaries,
} from '@/lib/chronicles/loaders';
import { CHRONICLES_PANEL, CHRONICLES_PANEL_BODY } from '@/lib/chronicles/typography';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllLocationSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const loc = getLocationBySlug(slug);
  if (!loc) return { title: 'Not found' };
  return { title: `${loc.name} · Krex's Chronicles`, description: loc.summary };
}

export default async function ChronicleLocationPage({ params }: PageProps) {
  const { slug } = await params;
  const location = getLocationBySlug(slug);
  if (!location) {
    return <ChronicleCommunityDetailPage slug={slug} kind="location" />;
  }

  const chapters = getChapterSummaries();
  const chapterLinks = location.chapterSlugs
    .map((s) => {
      const c = chapters.find((x) => x.slug === s);
      return c ? { href: `/chronicles/chapters/${s}`, label: c.title } : null;
    })
    .filter(Boolean) as { href: string; label: string }[];

  const characterLinks = location.characterSlugs
    .map((s) => {
      const ch = getCharacterBySlug(s);
      return ch ? { href: `/chronicles/characters/${s}`, label: ch.name } : null;
    })
    .filter(Boolean) as { href: string; label: string }[];

  const asideSections = [
    {
      title: 'Story role',
      body: <p className={CHRONICLES_PANEL_BODY}>{location.roleInStory}</p>,
    },
    {
      title: 'Look & feel',
      body: <p className={CHRONICLES_PANEL_BODY}>{location.visualStyle}</p>,
    },
    ...(chapterLinks.length > 0 ? [{ title: 'Chapters', links: chapterLinks }] : []),
    ...(characterLinks.length > 0 ? [{ title: 'Characters', links: characterLinks }] : []),
    ...(location.tags.length > 0
      ? [
          {
            title: 'Tags',
            body: (
              <ul className="flex flex-wrap gap-2">
                {location.tags.map((t) => (
                  <li key={t}>
                    <KxBadge variant={chronicleTagBadgeVariant(t)}>{t}</KxBadge>
                  </li>
                ))}
              </ul>
            ),
          },
        ]
      : []),
    ...(location.relatedGameSlug === 'minecore'
      ? [{ title: 'Related game', body: <MinecoreCallout /> }]
      : []),
  ];

  return (
    <div className="min-w-0 max-w-full overflow-x-hidden">
      <Link
        href="/chronicles/locations"
        className="text-sm font-semibold text-zinc-500 hover:text-[#02abb8] mb-6 inline-block"
      >
        ← Locations
      </Link>

      <div className="grid min-w-0 items-stretch gap-10 xl:gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)] xl:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
        <div className="min-w-0 max-w-full">
          <ChronicleFeaturedVisual
            imageUrl={location.featuredImageUrl}
            alt={location.name}
            badge="Location"
          />
          <ChronicleCategoryKicker>{location.visualStyle}</ChronicleCategoryKicker>
          <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-zinc-100">{location.name}</h1>

          <div className="mt-8">
            <ChroniclesMarkdown markdown={location.bodyMarkdown} />
          </div>

          {location.secretsMarkdown ? (
            <details className={`${CHRONICLES_PANEL} p-4 sm:p-5`}>
              <summary className="cursor-pointer text-sm font-black uppercase tracking-wider text-zinc-800 dark:text-white">
                Hidden lore
              </summary>
              <div className="mt-4">
                <ChroniclesMarkdown markdown={location.secretsMarkdown} />
              </div>
            </details>
          ) : null}
        </div>

        <ChronicleArticleAside sections={asideSections} />
      </div>
    </div>
  );
}
