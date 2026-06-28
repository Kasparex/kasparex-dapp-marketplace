import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChroniclesMarkdown } from '@/components/chronicles/ChroniclesMarkdown';
import { DiamondVeinsCallout } from '@/components/chronicles/DiamondVeinsCallout';
import { ChronicleFeaturedVisual } from '@/components/chronicles/ChronicleFeaturedVisual';
import { ChronicleArticleAside } from '@/components/chronicles/ChronicleArticleAside';
import { ChroniclesChapterAccessGate } from '@/components/chronicles/vault/ChroniclesChapterAccessGate';
import { getChapterBySlug } from '@/lib/chronicles/server';
import { getAdjacentChapters, getAllChapterSlugs, getCharacterBySlug, getLocationBySlug } from '@/lib/chronicles/loaders';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllChapterSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const chapter = getChapterBySlug(slug);
  if (!chapter) return { title: 'Chapter not found' };
  return {
    title: `${chapter.title} · Krex's Chronicles`,
    description: chapter.teaser,
  };
}

export default async function ChronicleChapterPage({ params }: PageProps) {
  const { slug } = await params;
  const chapter = getChapterBySlug(slug);
  if (!chapter) notFound();

  const { prev, next } = getAdjacentChapters(slug);

  const characterLinks = chapter.highlightCharacterSlugs
    .map((s) => {
      const c = getCharacterBySlug(s);
      return c ? { href: `/chronicles/characters/${s}`, label: c.name } : null;
    })
    .filter(Boolean) as { href: string; label: string }[];

  const locationLinks = chapter.locationSlugs
    .map((s) => {
      const l = getLocationBySlug(s);
      return l ? { href: `/chronicles/locations/${s}`, label: l.name } : null;
    })
    .filter(Boolean) as { href: string; label: string }[];

  const total = getAllChapterSlugs().length;
  const progressPct = Math.round((chapter.number / total) * 100);

  const asideSections = [
    {
      title: 'In this chapter',
      links: [...characterLinks, ...locationLinks],
    },
    {
      title: 'Reading order',
      links: [
        ...(prev ? [{ href: `/chronicles/chapters/${prev.slug}`, label: `Previous: ${prev.title}` }] : []),
        ...(next ? [{ href: `/chronicles/chapters/${next.slug}`, label: `Next: ${next.title}` }] : []),
      ],
    },
    ...(chapter.relatedGameSlug === 'diamond-veins'
      ? [
          {
            title: 'Related game',
            body: <DiamondVeinsCallout />,
          },
        ]
      : []),
  ];

  return (
    <div>
      <Link
        href="/chronicles/chapters"
        className="text-base font-semibold text-zinc-500 hover:text-[#02abb8] inline-flex items-center gap-1 mb-6"
      >
        ← Chapters
      </Link>

      <div className="grid gap-10 xl:gap-12 lg:grid-cols-[1fr_320px] xl:grid-cols-[minmax(0,1fr)_340px] items-start">
        <div className="min-w-0">
          <ChronicleFeaturedVisual
            imageUrl={chapter.featuredImageUrl}
            alt={chapter.title}
            badge={`Chapter ${chapter.number}`}
          />
          <p className="text-xs font-black uppercase tracking-widest text-[#02abb8] mb-1">Chapter {chapter.number}</p>
          <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-zinc-100">{chapter.title}</h1>
          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 mt-3 leading-relaxed">{chapter.teaser}</p>
          <div className="mt-5 h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden max-w-md">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-[#02abb8]"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="text-base text-zinc-500 mt-2">Timeline: {chapter.timeline}</p>

          <article className="pb-8 pt-10">
            <ChroniclesChapterAccessGate access={chapter.access}>
              <ChroniclesMarkdown markdown={chapter.bodyMarkdown} />
            </ChroniclesChapterAccessGate>
          </article>
        </div>

        <ChronicleArticleAside sections={asideSections} />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between border-t border-zinc-200 dark:border-zinc-800 pt-10 mt-12">
        {prev ? (
          <Link
            href={`/chronicles/chapters/${prev.slug}`}
            className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 hover:border-cyan-500/30 transition-colors"
          >
            <span className="text-xs font-black uppercase text-zinc-500">Previous</span>
            <p className="font-bold text-zinc-900 dark:text-zinc-100 text-xl">{prev.title}</p>
          </Link>
        ) : (
          <div className="flex-1" />
        )}
        {next ? (
          <Link
            href={`/chronicles/chapters/${next.slug}`}
            className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 hover:border-cyan-500/30 transition-colors text-right sm:text-right"
          >
            <span className="text-xs font-black uppercase text-zinc-500">Next</span>
            <p className="font-bold text-zinc-900 dark:text-zinc-100 text-xl">{next.title}</p>
          </Link>
        ) : (
          <div className="flex-1" />
        )}
      </div>
    </div>
  );
}
