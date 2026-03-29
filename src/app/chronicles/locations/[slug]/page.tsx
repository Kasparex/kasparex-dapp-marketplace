import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChroniclesMarkdown } from '@/components/chronicles/ChroniclesMarkdown';
import { ChronicleEntityChips } from '@/components/chronicles/ChronicleEntityChips';
import { DiamondVeinsCallout } from '@/components/chronicles/DiamondVeinsCallout';
import {
  getLocationBySlug,
  getAllLocationSlugs,
  getCharacterBySlug,
  getChapterSummaries,
} from '@/lib/chronicles/loaders';

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
  if (!location) notFound();

  const chapters = getChapterSummaries();
  const chapterLinks = location.chapterSlugs
    .map((s) => {
      const c = chapters.find((x) => x.slug === s);
      return c ? { slug: s, label: c.title, href: `/chronicles/chapters/${s}` } : null;
    })
    .filter(Boolean) as { slug: string; label: string; href: string }[];

  const characterLinks = location.characterSlugs
    .map((s) => {
      const ch = getCharacterBySlug(s);
      return ch ? { slug: s, label: ch.name, href: `/chronicles/characters/${s}` } : null;
    })
    .filter(Boolean) as { slug: string; label: string; href: string }[];

  return (
    <div>
      <Link href="/chronicles/locations" className="text-sm font-semibold text-zinc-500 hover:text-[#02abb8] mb-4 inline-block">
        ← Locations
      </Link>
      <p className="text-[10px] font-black uppercase tracking-widest text-[#02abb8]">{location.visualStyle}</p>
      <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-100 mt-1">{location.name}</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">{location.roleInStory}</p>

      <ChronicleEntityChips title="Chapters" links={chapterLinks} />
      <ChronicleEntityChips title="Characters" links={characterLinks} />

      {location.relatedGameSlug === 'diamond-veins' && (
        <div className="mb-8">
          <DiamondVeinsCallout />
        </div>
      )}

      <ChroniclesMarkdown markdown={location.bodyMarkdown} />

      {location.secretsMarkdown && (
        <details className="mt-10 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-zinc-50/80 dark:bg-zinc-900/40">
          <summary className="cursor-pointer text-sm font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
            Hidden lore
          </summary>
          <div className="mt-4">
            <ChroniclesMarkdown markdown={location.secretsMarkdown} />
          </div>
        </details>
      )}
    </div>
  );
}
