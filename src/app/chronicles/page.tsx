import Link from 'next/link';
import { ChroniclesHeader } from '@/components/chronicles/ChroniclesHeader';
import { ChroniclesMarkdown } from '@/components/chronicles/ChroniclesMarkdown';
import { DiamondVeinsCallout } from '@/components/chronicles/DiamondVeinsCallout';
import { ChronicleFeaturedVisual, ChronicleThumb } from '@/components/chronicles/ChronicleFeaturedVisual';
import { getOverview, getFragments, getChapterSummaries } from '@/lib/chronicles/loaders';
import { AdSlider } from '@/components/ads/AdSlider';

export default function ChroniclesHomePage() {
  const overview = getOverview();
  const fragments = getFragments();
  const chapters = getChapterSummaries();

  return (
    <div>
      <ChroniclesHeader />

      <div className="grid lg:grid-cols-3 gap-12 xl:gap-14">
        <div className="lg:col-span-2 space-y-10">
          <ChronicleFeaturedVisual
            imageUrl={overview.featuredImageUrl}
            alt={overview.title}
            badge="Overview"
          />
          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-zinc-900 dark:text-zinc-100 mb-3">{overview.title}</h2>
            <p className="text-lg sm:text-xl text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">{overview.tagline}</p>
            <ChroniclesMarkdown markdown={overview.bodyMarkdown} />
          </div>
          <div className="pt-4">
            <DiamondVeinsCallout />
          </div>
        </div>

        <aside className="space-y-10">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-[#02abb8] mb-5">Story timeline</h3>
            <ol className="space-y-4">
              {chapters.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/chronicles/chapters/${c.slug}`}
                    className="group flex gap-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 hover:border-cyan-500/30 transition-colors"
                  >
                    <ChronicleThumb imageUrl={c.featuredImageUrl} alt="" className="w-20 h-20 shrink-0 rounded-xl" />
                    <div className="min-w-0">
                      <span className="text-xs font-mono text-zinc-400">Chapter {c.number}</span>
                      <span className="block font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-[#02abb8] text-base sm:text-lg leading-snug">
                        {c.title}
                      </span>
                      <span className="text-base text-zinc-500 line-clamp-2 mt-1">{c.teaser}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
            <Link
              href="/chronicles/chapters"
              className="inline-block mt-5 text-base font-bold text-[#02abb8] hover:underline"
            >
              All chapters →
            </Link>
          </div>

          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-[#02abb8] mb-5">Codex fragments</h3>
            <div className="space-y-5">
              {fragments.map((f) => (
                <div
                  key={f.id}
                  className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-zinc-50/80 dark:bg-zinc-900/50"
                >
                  <ChronicleThumb imageUrl={f.featuredImageUrl} alt="" className="h-32 w-full" />
                  <div className="p-4 sm:p-5">
                    <p className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-3">{f.title}</p>
                    <ChroniclesMarkdown markdown={f.bodyMarkdown} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-4">Explore</h3>
            <ul className="space-y-3 text-base font-semibold">
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

          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/50 p-5 sm:p-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-[#02abb8] mb-4">Ad slots</h3>
            <div className="flex items-center justify-center min-h-[200px]">
              <AdSlider slotId="HALO_CHRONICLES_RIGHT" />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

