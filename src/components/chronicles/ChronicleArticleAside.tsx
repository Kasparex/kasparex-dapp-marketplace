import Link from 'next/link';
import type { ReactNode } from 'react';
import { AdSlider } from '@/components/ads/AdSlider';
import { AdSlotColumn } from '@/components/ads/AdSlotColumn';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { CHRONICLES_PANEL, CHRONICLES_PANEL_BODY } from '@/lib/chronicles/typography';

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
    <aside className="space-y-4 lg:sticky lg:top-6 self-start">
      {filtered.map((sec) => (
        <div key={sec.title} className={`${CHRONICLES_PANEL} p-4`}>
          <DAppSectionHeader title={sec.title} className="mb-3" />
          {sec.body ? <div className={CHRONICLES_PANEL_BODY}>{sec.body}</div> : null}
          {sec.links && sec.links.length > 0 ? (
            <ul className="space-y-2.5">
              {sec.links.map((l) => (
                <li key={`${l.href}-${l.label}`}>
                  <Link
                    href={l.href}
                    className="text-base font-semibold text-zinc-800 dark:text-zinc-200 hover:text-[#02abb8] transition-colors leading-relaxed"
                  >
                    {l.label}
                  </Link>
                  {l.sublabel ? (
                    <span className="block text-sm text-zinc-600 dark:text-zinc-400 mt-0.5 leading-relaxed">
                      {l.sublabel}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ))}

      <div className={`${CHRONICLES_PANEL} p-4`}>
        <DAppSectionHeader title="Ad slots" className="mb-3" />
        <AdSlotColumn className="rounded-xl">
          <AdSlider slotId="HALO_CHRONICLES_RIGHT" variant="sidebar" />
        </AdSlotColumn>
      </div>
    </aside>
  );
}
