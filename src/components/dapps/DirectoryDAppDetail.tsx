'use client';

import { useMemo, useState } from 'react';
import type { DApp } from '@/lib/dapps';
import { CommentsSection } from '@/components/vblog/CommentsSection';
import { DirectoryDAppOverviewPanel } from '@/components/dapps/panels/DirectoryDAppOverviewPanel';
import { DirectoryDAppDescriptionsPanel } from '@/components/dapps/panels/DirectoryDAppDescriptionsPanel';
import { DirectoryDAppFeesPanel } from '@/components/dapps/panels/DirectoryDAppFeesPanel';
import { DAppRevenueTreePanel } from '@/components/dapps/panels/DAppRevenueTreePanel';
import { DAppMetadataPanel } from '@/components/dapps/panels/DAppMetadataPanel';
import { PaymentAmountProvider } from '@/lib/dapps/PaymentAmountContext';
import { IconDAppWidget, IconDAppFees, IconOverview, IconComments, IconRevenueTree, IconMetadata } from '@/components/dapps/icons/DAppTabIcons';
import { useDAppCommentsCount } from '@/hooks/useDAppCommentsCount';
import type { DirectoryListing } from '@/lib/dapps/listingSubmissions';
import type { DAppTab } from '@/components/dapps/layout/DAppTabs';
import { DAppDetailShell } from '@/components/dapps/shell/DAppDetailShell';
import { KX_TAB_SECTION } from '@/lib/hub/shellTokens';

const BASE_TABS = [
  { id: 'overview', label: 'Overview', icon: <IconDAppWidget /> },
  { id: 'metadata', label: 'Metadata', icon: <IconMetadata /> },
  { id: 'descriptions', label: 'Description', icon: <IconOverview /> },
  { id: 'fees', label: 'Fees & Costs', icon: <IconDAppFees /> },
  { id: 'revenue-tree', label: 'Revenue Tree', icon: <IconRevenueTree /> },
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
    <PaymentAmountProvider>
      <DAppDetailShell
        dapp={dapp}
        listing={listing}
        tabs={tabs}
        currentTab={tab}
        onTabChange={setTab}
      >
        {tab === 'overview' ? (
          <div className={KX_TAB_SECTION}>
            <DirectoryDAppOverviewPanel dapp={dapp} listing={listing} />
          </div>
        ) : null}
        {tab === 'metadata' ? <DAppMetadataPanel dapp={dapp} listing={listing} /> : null}
        {tab === 'descriptions' ? (
          <div className={KX_TAB_SECTION}>
            <DirectoryDAppDescriptionsPanel listing={listing} />
          </div>
        ) : null}
        {tab === 'fees' ? (
          <div className={KX_TAB_SECTION}>
            <DirectoryDAppFeesPanel listing={listing} />
          </div>
        ) : null}
        {tab === 'revenue-tree' ? (
          <div className={KX_TAB_SECTION}>
            <DAppRevenueTreePanel dapp={dapp} />
          </div>
        ) : null}
        {tab === 'comments' ? (
          <div className={KX_TAB_SECTION}>
            <CommentsSection articleId={articleId} dappSectionHeader />
          </div>
        ) : null}
      </DAppDetailShell>
    </PaymentAmountProvider>
  );
}
