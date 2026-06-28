import { Metadata } from 'next';
import Link from 'next/link';
import { ChroniclesMarkdown } from '@/components/chronicles/ChroniclesMarkdown';
import { TokenPlaceholder } from '@/components/chronicles/TokenPlaceholder';
import { DiamondVeinsCallout } from '@/components/chronicles/DiamondVeinsCallout';
import { ChronicleFeaturedVisual } from '@/components/chronicles/ChronicleFeaturedVisual';
import { ChronicleCategoryKicker } from '@/components/chronicles/ChronicleCategoryKicker';
import { ChronicleArticleAside } from '@/components/chronicles/ChronicleArticleAside';
import { ChronicleCommunityDetailPage } from '@/components/chronicles/ChronicleCommunityDetailPage';
import { getCharacterBySlug, getChapterSummaries, getAllCharacterSlugs } from '@/lib/chronicles/loaders';
import { CHRONICLES_TEASER } from '@/lib/chronicles/typography';

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
  if (!character) {
    return <ChronicleCommunityDetailPage slug={slug} kind="character" />;
  }

  const chapters = getChapterSummaries();
  const firstCh = character.firstAppearanceChapterSlug
    ? chapters.find((x) => x.slug === character.firstAppearanceChapterSlug)
    : null;

  const showDiamond =
    character.tags.includes('diamond-veins') ||
    character.slug === 'vector' ||
    character.slug === 'aria' ||
    character.slug === 'krex';

  const relationshipLinks = character.relationships.map((r) => {
    const other = getCharacterBySlug(r.characterSlug);
    const label = other?.name ?? r.characterSlug;
    return { href: `/chronicles/characters/${r.characterSlug}`, label, sublabel: r.relation };
  });

  const asideSections = [
    {
      title: 'At a glance',
      body: (
        <dl className="space-y-3 text-base leading-relaxed">
          <div>
            <dt className="text-zinc-600 dark:text-zinc-400 text-xs font-black uppercase tracking-wider">Role</dt>
            <dd className="font-semibold text-zinc-900 dark:text-zinc-100">{character.role}</dd>
          </div>
          <div>
            <dt className="text-zinc-600 dark:text-zinc-400 text-xs font-black uppercase tracking-wider">Story status</dt>
            <dd className="font-semibold text-zinc-900 dark:text-zinc-100">{character.storyStatus}</dd>
          </div>
          {firstCh ? (
            <div>
              <dt className="text-zinc-500 text-xs font-black uppercase tracking-wider">First appearance</dt>
              <dd>
                <Link href={`/chronicles/chapters/${firstCh.slug}`} className="font-bold text-[#02abb8] hover:underline">
                  {firstCh.title}
                </Link>
              </dd>
            </div>
          ) : null}
        </dl>
      ),
    },
    ...(relationshipLinks.length > 0
      ? [
          {
            title: 'Relationships',
            links: relationshipLinks,
          },
        ]
      : []),
    ...(character.abilities.length > 0
      ? [
          {
            title: 'Abilities / traits',
            body: (
              <ul className="flex flex-wrap gap-2">
                {character.abilities.map((a) => (
                  <li
                    key={a}
                    className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-sm font-semibold text-zinc-800 dark:text-zinc-200"
                  >
                    {a}
                  </li>
                ))}
              </ul>
            ),
          },
        ]
      : []),
    ...(showDiamond
      ? [
          {
            title: 'Diamond Veins',
            body: <DiamondVeinsCallout />,
          },
        ]
      : []),
    {
      title: 'Token (future)',
      body: (
        <TokenPlaceholder
          className="mt-0"
          status={character.token.status}
          contractAddress={character.token.contractAddress}
          utility={character.token.utility}
        />
      ),
    },
  ];

  return (
    <div>
      <Link
        href="/chronicles/characters"
        className="text-sm font-semibold text-zinc-500 hover:text-[#02abb8] mb-6 inline-block"
      >
        ← Characters
      </Link>

      <div className="grid gap-10 xl:gap-12 lg:grid-cols-[1fr_320px] xl:grid-cols-[minmax(0,1fr)_340px] items-start">
        <div className="min-w-0">
          <ChronicleFeaturedVisual imageUrl={character.featuredImageUrl} alt={character.name} badge={character.kind} />
          <ChronicleCategoryKicker>{character.kind}</ChronicleCategoryKicker>
          <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-zinc-100">{character.name}</h1>
          <p className={`${CHRONICLES_TEASER} mt-4`}>{character.summary}</p>

          <div className="mt-10">
            <ChroniclesMarkdown markdown={character.bodyMarkdown} />
          </div>
        </div>

        <ChronicleArticleAside sections={asideSections} />
      </div>
    </div>
  );
}
