import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChroniclesMarkdown } from '@/components/chronicles/ChroniclesMarkdown';
import { ChronicleEntityChips } from '@/components/chronicles/ChronicleEntityChips';
import { DiamondVeinsCallout } from '@/components/chronicles/DiamondVeinsCallout';
import { getVehicleBySlug, getAllVehicleSlugs, getCharacterBySlug, getChapterSummaries } from '@/lib/chronicles/loaders';

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
      return c ? { slug: s, label: c.title, href: `/chronicles/chapters/${s}` } : null;
    })
    .filter(Boolean) as { slug: string; label: string; href: string }[];

  const owner =
    vehicle.ownerCharacterSlug != null ? getCharacterBySlug(vehicle.ownerCharacterSlug) : null;

  const showDiamond = vehicle.tags.includes('diamond-veins');

  return (
    <div>
      <Link href="/chronicles/vehicles" className="text-sm font-semibold text-zinc-500 hover:text-[#02abb8] mb-4 inline-block">
        ← Vehicles & tech
      </Link>
      <p className="text-[10px] font-black uppercase tracking-widest text-[#02abb8]">{vehicle.kind}</p>
      <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-100 mt-1">{vehicle.name}</h1>
      {owner && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
          Owner:{' '}
          <Link href={`/chronicles/characters/${owner.slug}`} className="font-bold text-[#02abb8] hover:underline">
            {owner.name}
          </Link>
        </p>
      )}

      <ChronicleEntityChips title="Appearances" links={chapterLinks} />

      {showDiamond && (
        <div className="mb-8">
          <DiamondVeinsCallout />
        </div>
      )}

      <ChroniclesMarkdown markdown={vehicle.bodyMarkdown} />
    </div>
  );
}
