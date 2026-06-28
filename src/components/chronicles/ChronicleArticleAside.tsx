import Link from 'next/link';
import type { ReactNode } from 'react';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { ChroniclesAdSlot } from '@/components/chronicles/ChroniclesAdSlot';
import { CHRONICLES_PANEL, CHRONICLES_PANEL_BODY } from '@/lib/chronicles/typography';

export type AsideLink = { href: string; label: string; sublabel?: string };

export type AsideSection = {
  title: string;
  links?: AsideLink[];
  body?: ReactNode;
};

export function ChronicleArticleAside({
  sections,
  topContent,
}: {
  sections: AsideSection[];
  topContent?: ReactNode;
}) {
  const filtered = sections.filter((s) => s.body != null || (s.links != null && s.links.length > 0));

  return (
    <aside className="space-y-4 lg:sticky lg:top-6 self-start">
      {topContent}
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
                    <span className="block kx-body mt-0.5 leading-relaxed">
                      {l.sublabel}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ))}

      <ChroniclesAdSlot layout="rail" />
    </aside>
  );
}
