import Link from 'next/link';
import type { ReactNode } from 'react';
import { AdSlider } from '@/components/ads/AdSlider';

export type AsideLink = { href: string; label: string; sublabel?: string };

export type AsideSection = {
  title: string;
  links?: AsideLink[];
  body?: ReactNode;
};

export function ChronicleArticleAside({ sections }: { sections: AsideSection[] }) {
  const filtered = sections.filter((s) => s.body != null || (s.links != null && s.links.length > 0));
  if (filtered.length === 0) return null;

  return (
    <aside className="space-y-6 lg:sticky lg:top-6 self-start">
      {filtered.map((sec) => (
        <div
          key={sec.title}
          className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-900/55 p-5 sm:p-6"
        >
          <h2 className="text-sm font-black uppercase tracking-widest text-[#02abb8] mb-3">{sec.title}</h2>
          {sec.body}
          {sec.links && sec.links.length > 0 ? (
            <ul className="space-y-2.5">
              {sec.links.map((l) => (
                <li key={`${l.href}-${l.label}`}>
                  <Link
                    href={l.href}
                    className="text-base font-semibold text-zinc-800 dark:text-zinc-200 hover:text-[#02abb8] transition-colors"
                  >
                    {l.label}
                  </Link>
                  {l.sublabel ? (
                    <span className="block text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{l.sublabel}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ))}

      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-900/55 p-5 sm:p-6">
        <h2 className="text-sm font-black uppercase tracking-widest text-[#02abb8] mb-3">Ad slots</h2>
        <div className="flex items-center justify-center min-h-[200px]">
          <AdSlider slotId="HALO_CHRONICLES_RIGHT" />
        </div>
      </div>
    </aside>
  );
}
