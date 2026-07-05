import { Metadata } from 'next';
import Link from 'next/link';
import { ChronicleCommunityDetailPage } from '@/components/chronicles/ChronicleCommunityDetailPage';
import { ChroniclesMarkdown } from '@/components/chronicles/ChroniclesMarkdown';
import { MinecoreCallout } from '@/components/chronicles/MinecoreCallout';
import { ChronicleFeaturedVisual } from '@/components/chronicles/ChronicleFeaturedVisual';
import { ChronicleCategoryKicker } from '@/components/chronicles/ChronicleCategoryKicker';
import { ChronicleArticleAside } from '@/components/chronicles/ChronicleArticleAside';
import { getVehicleBySlug, getAllVehicleSlugs, getCharacterBySlug, getChapterSummaries } from '@/lib/chronicles/loaders';
import { CHRONICLES_PANEL_BODY } from '@/lib/chronicles/typography';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllVehicleSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const v = getVehicleBySlug(slug);
  if (!v) return { title: 'Not found' };
  return { title: `${v.name} · Krex's Chronicles`, description: v.summary };
}

export default async function ChronicleVehiclePage({ params }: PageProps) {
  const { slug } = await params;
  const vehicle = getVehicleBySlug(slug);
  if (!vehicle) {
    return <ChronicleCommunityDetailPage slug={slug} kind="vehicle" />;
  }

  const chapters = getChapterSummaries();
  const chapterLinks = vehicle.chapterSlugs
    .map((s) => {
      const c = chapters.find((x) => x.slug === s);
      return c ? { href: `/chronicles/chapters/${s}`, label: c.title } : null;
    })
    .filter(Boolean) as { href: string; label: string }[];

  const owner =
    vehicle.ownerCharacterSlug != null ? getCharacterBySlug(vehicle.ownerCharacterSlug) : null;

  const showMinecore = vehicle.tags.includes('minecore');

  const asideSections = [
    {
      title: 'Summary',
      body: <p className={CHRONICLES_PANEL_BODY}>{vehicle.summary}</p>,
    },
    ...(owner
      ? [
          {
            title: 'Owner / operator',
            links: [{ href: `/chronicles/characters/${owner.slug}`, label: owner.name }],
          },
        ]
      : []),
    ...(chapterLinks.length > 0 ? [{ title: 'Appearances', links: chapterLinks }] : []),
    ...(showMinecore ? [{ title: 'Related game', body: <MinecoreCallout /> }] : []),
  ];

  return (
    <div className="min-w-0 max-w-full overflow-x-hidden">
      <Link
        href="/chronicles/vehicles"
        className="text-sm font-semibold text-zinc-500 hover:text-[#02abb8] mb-6 inline-block"
      >
        ← Vehicles & tech
      </Link>

      <div className="grid gap-10 xl:gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)] xl:grid-cols-[minmax(0,1fr)_minmax(0,340px)] items-start min-w-0">
        <div className="min-w-0 max-w-full">
          <ChronicleFeaturedVisual imageUrl={vehicle.featuredImageUrl} alt={vehicle.name} badge={vehicle.kind} />
          <ChronicleCategoryKicker>{vehicle.kind}</ChronicleCategoryKicker>
          <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-zinc-100">{vehicle.name}</h1>

          <div className="mt-8">
            <ChroniclesMarkdown markdown={vehicle.bodyMarkdown} />
          </div>

        </div>

        <ChronicleArticleAside sections={asideSections} />
      </div>
    </div>
  );
}
