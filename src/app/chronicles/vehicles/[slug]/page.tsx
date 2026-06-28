import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChroniclesMarkdown } from '@/components/chronicles/ChroniclesMarkdown';
import { DiamondVeinsCallout } from '@/components/chronicles/DiamondVeinsCallout';
import { ChronicleFeaturedVisual } from '@/components/chronicles/ChronicleFeaturedVisual';
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
  if (!vehicle) notFound();

  const chapters = getChapterSummaries();
  const chapterLinks = vehicle.chapterSlugs
    .map((s) => {
      const c = chapters.find((x) => x.slug === s);
      return c ? { href: `/chronicles/chapters/${s}`, label: c.title } : null;
    })
    .filter(Boolean) as { href: string; label: string }[];

  const owner =
    vehicle.ownerCharacterSlug != null ? getCharacterBySlug(vehicle.ownerCharacterSlug) : null;

  const showDiamond = vehicle.tags.includes('diamond-veins');

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
    ...(showDiamond ? [{ title: 'Diamond Veins', body: <DiamondVeinsCallout /> }] : []),
  ];

  return (
    <div>
      <Link
        href="/chronicles/vehicles"
        className="text-sm font-semibold text-zinc-500 hover:text-[#02abb8] mb-6 inline-block"
      >
        ← Vehicles & tech
      </Link>

      <div className="grid gap-10 xl:gap-12 lg:grid-cols-[1fr_320px] xl:grid-cols-[minmax(0,1fr)_340px] items-start">
        <div className="min-w-0">
          <ChronicleFeaturedVisual imageUrl={vehicle.featuredImageUrl} alt={vehicle.name} badge={vehicle.kind} />
          <p className="text-xs font-black uppercase tracking-widest text-[#02abb8]">{vehicle.kind}</p>
          <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-zinc-100 mt-1">{vehicle.name}</h1>

          <div className="mt-8">
            <ChroniclesMarkdown markdown={vehicle.bodyMarkdown} />
          </div>

        </div>

        <ChronicleArticleAside sections={asideSections} />
      </div>
    </div>
  );
}
