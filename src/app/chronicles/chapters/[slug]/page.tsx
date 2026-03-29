import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChroniclesMarkdown } from '@/components/chronicles/ChroniclesMarkdown';
import { ChronicleEntityChips } from '@/components/chronicles/ChronicleEntityChips';
import { DiamondVeinsCallout } from '@/components/chronicles/DiamondVeinsCallout';
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
      return c ? { slug: s, label: c.name, href: `/chronicles/characters/${s}` } : null;
    })
    .filter(Boolean) as { slug: string; label: string; href: string }[];

  const locationLinks = chapter.locationSlugs
    .map((s) => {
      const l = getLocationBySlug(s);
      return l ? { slug: s, label: l.name, href: `/chronicles/locations/${s}` } : null;
    })
    .filter(Boolean) as { slug: string; label: string; href: string }[];

  const total = getAllChapterSlugs().length;
  const progressPct = Math.round((chapter.number / total) * 100);

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/chronicles/chapters"
          className="text-sm font-semibold text-zinc-500 hover:text-[#02abb8] inline-flex items-center gap-1 mb-4"
        >
          ← Chapters
        </Link>
        <p className="text-[10px] font-black uppercase tracking-widest text-[#02abb8] mb-1">
          Chapter {chapter.number}
        </p>
        <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-100">{chapter.title}</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">{chapter.teaser}</p>
        <div className="mt-4 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden max-w-md">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-[#02abb8]"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-xs text-zinc-500 mt-1">Timeline: {chapter.timeline}</p>
      </div>

      <ChronicleEntityChips title="In this chapter" links={[...characterLinks, ...locationLinks]} />

      {chapter.relatedGameSlug === 'diamond-veins' && (
        <div className="mb-8">
          <DiamondVeinsCallout />
        </div>
      )}

      <article className="pb-12">
        <ChroniclesMarkdown markdown={chapter.bodyMarkdown} />
      </article>

      <div className="flex flex-col sm:flex-row gap-4 justify-between border-t border-zinc-200 dark:border-zinc-800 pt-8">
        {prev ? (
          <Link
            href={`/chronicles/chapters/${prev.slug}`}
            className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 hover:border-cyan-500/30 transition-colors"
          >
            <span className="text-[10px] font-black uppercase text-zinc-500">Previous</span>
            <p className="font-bold text-zinc-900 dark:text-zinc-100">{prev.title}</p>
          </Link>
        ) : (
          <div className="flex-1" />
        )}
        {next ? (
          <Link
            href={`/chronicles/chapters/${next.slug}`}
            className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 hover:border-cyan-500/30 transition-colors text-right sm:text-right"
          >
            <span className="text-[10px] font-black uppercase text-zinc-500">Next</span>
            <p className="font-bold text-zinc-900 dark:text-zinc-100">{next.title}</p>
          </Link>
        ) : (
          <div className="flex-1" />
        )}
      </div>
    </div>
  );
}
