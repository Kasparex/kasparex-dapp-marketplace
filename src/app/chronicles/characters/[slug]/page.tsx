import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChroniclesMarkdown } from '@/components/chronicles/ChroniclesMarkdown';
import { TokenPlaceholder } from '@/components/chronicles/TokenPlaceholder';
import { DiamondVeinsCallout } from '@/components/chronicles/DiamondVeinsCallout';
import { getCharacterBySlug, getChapterSummaries, getAllCharacterSlugs } from '@/lib/chronicles/loaders';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllCharacterSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const c = getCharacterBySlug(slug);
  if (!c) return { title: 'Not found' };
  return { title: `${c.name} · Krex's Chronicles`, description: c.summary };
}

export default async function ChronicleCharacterPage({ params }: PageProps) {
  const { slug } = await params;
  const character = getCharacterBySlug(slug);
  if (!character) notFound();

  const chapters = getChapterSummaries();
  const firstCh = character.firstAppearanceChapterSlug
    ? chapters.find((x) => x.slug === character.firstAppearanceChapterSlug)
    : null;

  const showDiamond =
    character.tags.includes('diamond-veins') ||
    character.slug === 'vector' ||
    character.slug === 'aria' ||
    character.slug === 'krex';

  return (
    <div>
      <Link href="/chronicles/characters" className="text-sm font-semibold text-zinc-500 hover:text-[#02abb8] mb-4 inline-block">
        ← Characters
      </Link>
      <p className="text-[10px] font-black uppercase tracking-widest text-[#02abb8]">{character.kind}</p>
      <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-100 mt-1">{character.name}</h1>
      <p className="text-sm text-zinc-500 mt-1">
        Role: {character.role} · Story: {character.storyStatus}
      </p>
      <p className="text-zinc-600 dark:text-zinc-400 mt-4">{character.summary}</p>

      {character.abilities.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-black uppercase text-zinc-500 mb-2">Abilities / traits</p>
          <ul className="flex flex-wrap gap-2">
            {character.abilities.map((a) => (
              <li
                key={a}
                className="px-3 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold text-zinc-800 dark:text-zinc-200"
              >
                {a}
              </li>
            ))}
          </ul>
        </div>
      )}

      {firstCh && (
        <p className="mt-6 text-sm">
          <span className="text-zinc-500">First appearance: </span>
          <Link href={`/chronicles/chapters/${firstCh.slug}`} className="font-bold text-[#02abb8] hover:underline">
            {firstCh.title}
          </Link>
        </p>
      )}

      {character.relationships.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-black uppercase text-zinc-500 mb-2">Relationships</p>
          <ul className="space-y-2 text-sm">
            {character.relationships.map((r) => {
              const other = getCharacterBySlug(r.characterSlug);
              const label = other?.name ?? r.characterSlug;
              return (
                <li key={r.characterSlug}>
                  <Link href={`/chronicles/characters/${r.characterSlug}`} className="font-bold text-[#02abb8] hover:underline">
                    {label}
                  </Link>
                  <span className="text-zinc-500"> — {r.relation}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {showDiamond && (
        <div className="mt-8">
          <DiamondVeinsCallout />
        </div>
      )}

      <div className="mt-10">
        <ChroniclesMarkdown markdown={character.bodyMarkdown} />
      </div>

      <TokenPlaceholder
        status={character.token.status}
        contractAddress={character.token.contractAddress}
        utility={character.token.utility}
      />
    </div>
  );
}
