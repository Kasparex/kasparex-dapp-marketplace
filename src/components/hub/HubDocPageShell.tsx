'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { HubListingTitleRow } from '@/components/hub/HubListingTitleRow';
import { HubBenefitsPanel } from '@/components/hub/HubBenefitsPanel';
import { HubPageAccentLayout } from '@/components/hub/HubPageAccentLayout';
import { HUB_MAIN_COLUMN, HUB_MAIN_INNER, HUB_PAGE_BG, HUB_STANDALONE_MAIN } from '@/lib/hub/hubLayout';

type HubDocPageShellProps = {
  children: ReactNode;
  sidebar?: ReactNode;
  /** Standalone pages without a sidebar column */
  standalone?: boolean;
  /** Hub project id for accent-colored UI (defaults to kasparex-dapps). */
  projectId?: string;
};

export function HubDocPageShell({
  children,
  sidebar,
  standalone = false,
  projectId = 'kasparex-dapps',
}: HubDocPageShellProps) {
  return (
    <div className={`flex min-h-screen flex-col ${HUB_PAGE_BG}`}>
      <Header />
      <main className="flex min-h-[calc(100vh-4rem)] flex-1 flex-col lg:flex-row">
        <HubPageAccentLayout projectId={projectId}>
          {sidebar}
          <div className={standalone ? HUB_STANDALONE_MAIN : HUB_MAIN_COLUMN}>
            <div className={standalone ? 'mx-auto w-full max-w-4xl' : HUB_MAIN_INNER}>{children}</div>
          </div>
        </HubPageAccentLayout>
      </main>
      <Footer />
    </div>
  );
}

export function HubStandaloneIntro(props: {
  title: string;
  count?: number;
  countLabel?: string;
  description?: ReactNode;
  benefits?: boolean;
  backHref?: string;
  backLabel?: string;
  projectId?: string;
}) {
  const {
    title,
    count = 1,
    countLabel = 'section',
    description,
    benefits = true,
    backHref = '/hub',
    backLabel = 'Back to Hub',
    projectId = 'kasparex-dapps',
  } = props;

  return (
    <>
      {backHref ? (
        <Link href={backHref} className="k-control-btn mb-6 inline-flex w-fit gap-2">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {backLabel}
        </Link>
      ) : null}
      <HubListingTitleRow
        projectId={projectId}
        title={title}
        count={count}
        countLabel={countLabel}
        benefits={benefits ? <HubBenefitsPanel variant="compact" className="w-full" /> : undefined}
      />
      {description ? <p className="kx-body -mt-4 mb-8 max-w-3xl">{description}</p> : null}
    </>
  );
}
