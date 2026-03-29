import Link from 'next/link';
import { ChroniclesHeader } from '@/components/chronicles/ChroniclesHeader';
import { ChroniclesMarkdown } from '@/components/chronicles/ChroniclesMarkdown';
import { DiamondVeinsCallout } from '@/components/chronicles/DiamondVeinsCallout';
import { getOverview, getFragments, getChapterSummaries } from '@/lib/chronicles/loaders';

export default function ChroniclesHomePage() {
  const overview = getOverview();
  const fragments = getFragments();
  const chapters = getChapterSummaries();

  return (
    <div>
      <ChroniclesHeader />

      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mb-2">{overview.title}</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">{overview.tagline}</p>
          <ChroniclesMarkdown markdown={overview.bodyMarkdown} />
          <div className="mt-10">
            <DiamondVeinsCallout />
          </div>
        </div>

        <aside className="space-y-8">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-[#02abb8] mb-4">Story timeline</h3>
            <ol className="space-y-3">
              {chapters.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/chronicles/chapters/${c.slug}`}
                    className="group flex flex-col rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 hover:border-cyan-500/30 transition-colors"
                  >
                    <span className="text-[10px] font-mono text-zinc-400">Chapter {c.number}</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-[#02abb8] text-sm">
                      {c.title}
                    </span>
                    <span className="text-xs text-zinc-500 line-clamp-2 mt-1">{c.teaser}</span>
                  </Link>
                </li>
              ))}
            </ol>
            <Link
              href="/chronicles/chapters"
              className="inline-block mt-4 text-sm font-bold text-[#02abb8] hover:underline"
            >
              All chapters →
            </Link>
          </div>

          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-[#02abb8] mb-4">Codex fragments</h3>
            <div className="space-y-4">
              {fragments.map((f) => (
                <div
                  key={f.id}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-zinc-50/80 dark:bg-zinc-900/50"
                >
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mb-2">{f.title}</p>
                  <ChroniclesMarkdown markdown={f.bodyMarkdown} />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-3">Explore</h3>
            <ul className="space-y-2 text-sm font-semibold">
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
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
