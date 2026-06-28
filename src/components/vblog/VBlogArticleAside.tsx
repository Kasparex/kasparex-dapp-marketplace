import type { ReactNode } from 'react';
import Link from 'next/link';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { AdSlider } from '@/components/ads/AdSlider';
import { CHRONICLES_PANEL } from '@/lib/chronicles/typography';

export type VBlogAsideLink = { href: string; label: string; sublabel?: string };

export type VBlogAsideSection = {
  title: string;
  links?: VBlogAsideLink[];
  body?: ReactNode;
  /** When true, body is rendered without default panel body typography wrapper. */
  rawBody?: boolean;
};

export function VBlogArticleAside({ sections }: { sections: VBlogAsideSection[] }) {
  const filtered = sections.filter((s) => s.body != null || (s.links != null && s.links.length > 0));

  return (
    <aside id="kasparex-vblog-side-panel" className="space-y-4 lg:sticky lg:top-6 self-start">
      {filtered.map((sec) => (
        <div key={sec.title} className={`${CHRONICLES_PANEL} p-5 sm:p-6`}>
          <DAppSectionHeader title={sec.title} className="mb-4" />
          {sec.body ? (
            sec.rawBody ? (
              <div className="space-y-3">{sec.body}</div>
            ) : (
              <div className="text-base text-zinc-600 dark:text-zinc-400 leading-8 space-y-3">{sec.body}</div>
            )
          ) : null}
          {sec.links && sec.links.length > 0 ? (
            <ul className="space-y-3">
              {sec.links.map((l) => (
                <li key={`${l.href}-${l.label}`}>
                  <Link
                    href={l.href}
                    className="text-base font-semibold text-zinc-800 dark:text-zinc-200 hover:text-[#02abb8] transition-colors leading-relaxed"
                  >
                    {l.label}
                  </Link>
                  {l.sublabel ? <span className="block kx-body mt-1 leading-relaxed">{l.sublabel}</span> : null}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ))}

      <div
        id="ad-slot-vblog-article-aside"
        className={`${CHRONICLES_PANEL} p-5 sm:p-6 flex items-center justify-center min-h-[200px] scroll-mt-24`}
      >
        <AdSlider slotId="VBLOG_ARTICLE_ASIDE_BOTTOM" relaxHaloFrame />
      </div>
    </aside>
  );
}
