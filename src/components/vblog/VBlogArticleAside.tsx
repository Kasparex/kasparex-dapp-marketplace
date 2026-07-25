import type { ReactNode } from 'react';
import Link from 'next/link';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { HubAsideRail } from '@/components/hub/HubAsideRail';
import { CHRONICLES_PANEL, CHRONICLES_PANEL_BODY } from '@/lib/chronicles/typography';

export type VBlogAsideLink = { href: string; label: string; sublabel?: string; openInNewTab?: boolean };

export type VBlogAsideSection = {
  title: string;
  links?: VBlogAsideLink[];
  body?: ReactNode;
  /** When true, body is rendered without default panel body typography wrapper. */
  rawBody?: boolean;
};

export function VBlogArticleAside({
  sections,
  topContent,
}: {
  sections: VBlogAsideSection[];
  topContent?: ReactNode;
}) {
  const filtered = sections.filter((s) => s.body != null || (s.links != null && s.links.length > 0));

  return (
    <HubAsideRail adSlotId="HALO_VBLOG_RIGHT" adId="ad-slot-vblog-article-aside">
      {topContent}
      {filtered.map((sec) => (
        <div key={sec.title} className={`${CHRONICLES_PANEL} p-4`}>
          <DAppSectionHeader title={sec.title} className="mb-3" />
          {sec.body ? (
            sec.rawBody ? (
              <div className="space-y-3">{sec.body}</div>
            ) : (
              <div className={CHRONICLES_PANEL_BODY}>{sec.body}</div>
            )
          ) : null}
          {sec.links && sec.links.length > 0 ? (
            <ul className="space-y-2.5">
              {sec.links.map((l) => (
                <li key={`${l.href}-${l.label}`}>
                  <Link
                    href={l.href}
                    target={l.openInNewTab ? '_blank' : undefined}
                    rel={l.openInNewTab ? 'noopener noreferrer' : undefined}
                    className="text-base font-semibold text-zinc-800 dark:text-zinc-200 hover:text-[#e30d1b] transition-colors leading-relaxed"
                  >
                    {l.label}
                  </Link>
                  {l.sublabel ? (
                    <span className="block kx-body mt-0.5 leading-relaxed">{l.sublabel}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ))}
    </HubAsideRail>
  );
}
