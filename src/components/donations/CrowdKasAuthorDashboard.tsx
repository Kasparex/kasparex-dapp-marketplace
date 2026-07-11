'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export type CrowdKasDashboardTab = 'l1-covenant' | 'l2-escrow' | 'my-campaigns';

function tabFromParams(tab: string | null): CrowdKasDashboardTab {
  if (tab === 'l2-escrow' || tab === 'l2') return 'l2-escrow';
  if (tab === 'my-campaigns' || tab === 'archive') return 'my-campaigns';
  return 'l1-covenant';
}

export function CrowdKasAuthorDashboard({
  myCampaignsCount = 0,
  children,
}: {
  myCampaignsCount?: number;
  children: (activeTab: CrowdKasDashboardTab) => React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = tabFromParams(searchParams.get('tab'));

  const setActiveTab = useCallback(
    (tab: CrowdKasDashboardTab) => {
      const params = new URLSearchParams(searchParams.toString());
      if (tab === 'l1-covenant') params.delete('tab');
      else params.set('tab', tab);
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const tabClass = (tab: CrowdKasDashboardTab) =>
    `px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
      activeTab === tab
        ? 'bg-white dark:bg-zinc-800 text-emerald-700 dark:text-emerald-300 shadow-lg shadow-black/5 border border-zinc-200 dark:border-zinc-700'
        : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
    }`;

  return (
    <div className="space-y-8">
      <div id="crowdkas-dashboard-main" className="scroll-mt-24" />
      <div className="flex flex-wrap items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-2xl w-fit border border-zinc-200 dark:border-zinc-800">
        <button type="button" onClick={() => setActiveTab('l1-covenant')} className={tabClass('l1-covenant')}>
          L1 covenant campaign
        </button>
        <button type="button" onClick={() => setActiveTab('l2-escrow')} className={tabClass('l2-escrow')}>
          L2 escrow campaign
        </button>
        <button type="button" onClick={() => setActiveTab('my-campaigns')} className={tabClass('my-campaigns')}>
          My campaigns ({myCampaignsCount})
        </button>
      </div>
      {children(activeTab)}
    </div>
  );
}
