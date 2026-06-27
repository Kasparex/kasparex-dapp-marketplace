'use client';

import { useMemo, useState } from 'react';
import type { DApp } from '@/lib/dapps';
import { CommentsSection } from '@/components/vblog/CommentsSection';
import { DAppRightColumn } from '@/components/dapps/DAppRightColumn';
import { DirectoryDAppOverviewPanel } from '@/components/dapps/panels/DirectoryDAppOverviewPanel';
import { DirectoryDAppDescriptionsPanel } from '@/components/dapps/panels/DirectoryDAppDescriptionsPanel';
import { DirectoryDAppFeesPanel } from '@/components/dapps/panels/DirectoryDAppFeesPanel';
import { DAppsWithSidebarLayout } from '@/components/dapps/layout/DAppsWithSidebarLayout';
import { IconDAppWidget, IconDAppFees, IconOverview, IconComments } from '@/components/dapps/icons/DAppTabIcons';
import { useDAppCommentsCount } from '@/hooks/useDAppCommentsCount';
import type { DirectoryListing } from '@/lib/dapps/listingSubmissions';
import type { DAppTab } from '@/components/dapps/layout/DAppTabs';

const BASE_TABS = [
  { id: 'overview', label: 'Overview', icon: <IconDAppWidget /> },
  { id: 'descriptions', label: 'Description', icon: <IconOverview /> },
  { id: 'fees', label: 'Fees & Costs', icon: <IconDAppFees /> },
  { id: 'comments', label: 'Comments', icon: <IconComments /> },
] as const;

type DirectoryTabId = (typeof BASE_TABS)[number]['id'];

function CommentsTabBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-cyan-500/15 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-cyan-800 dark:text-cyan-300">
      {count}
    </span>
  );
}

type DirectoryDAppDetailProps = {
  dapp: DApp;
  listing: DirectoryListing;
};

export function DirectoryDAppDetail({ dapp, listing }: DirectoryDAppDetailProps) {
  const [tab, setTab] = useState<DirectoryTabId>('overview');
  const articleId = `dapp:${dapp.slug || dapp.id}`;
  const commentsCount = useDAppCommentsCount(articleId);

  const tabs = useMemo((): readonly DAppTab<DirectoryTabId>[] => {
    return BASE_TABS.map((t) =>
      t.id === 'comments'
        ? { ...t, rightAdornment: <CommentsTabBadge count={commentsCount} /> }
        : t,
    );
  }, [commentsCount]);

  return (
    <DAppsWithSidebarLayout
      tabs={tabs}
      currentTab={tab}
      onTabChange={setTab}
      main={
        <>
          {tab === 'overview' ? <DirectoryDAppOverviewPanel dapp={dapp} listing={listing} /> : null}
          {tab === 'descriptions' ? <DirectoryDAppDescriptionsPanel listing={listing} /> : null}
          {tab === 'fees' ? <DirectoryDAppFeesPanel listing={listing} /> : null}
          {tab === 'comments' ? <CommentsSection articleId={articleId} /> : null}
        </>
      }
      sidebar={<DAppRightColumn dapp={dapp} contractAddress="" hideRevenueTree />}
    />
  );
}
