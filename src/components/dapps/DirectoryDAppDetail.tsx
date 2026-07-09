'use client';

import { useMemo, useState } from 'react';
import type { DApp } from '@/lib/dapps';
import { CommentsSection } from '@/components/vblog/CommentsSection';
import { DirectoryDAppOverviewPanel } from '@/components/dapps/panels/DirectoryDAppOverviewPanel';
import { DirectoryDAppDescriptionsPanel } from '@/components/dapps/panels/DirectoryDAppDescriptionsPanel';
import { PaymentAmountProvider } from '@/lib/dapps/PaymentAmountContext';
import { useDAppCommentsCount } from '@/hooks/useDAppCommentsCount';
import type { DirectoryListing } from '@/lib/dapps/listingSubmissions';
import { DAppDetailShell } from '@/components/dapps/shell/DAppDetailShell';
import { KX_TAB_SECTION } from '@/lib/hub/shellTokens';
import { buildDAppDetailTabs } from '@/lib/dapps/buildDAppDetailTabs';

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
  const [tab, setTab] = useState('overview');
  const articleId = `dapp:${dapp.slug || dapp.id}`;
  const commentsCount = useDAppCommentsCount(articleId);

  const tabs = useMemo(
    () =>
      buildDAppDetailTabs({
        dapp,
        commentsCount,
        commentsBadge: <CommentsTabBadge count={commentsCount} />,
        includeOverview: true,
      }),
    [dapp, commentsCount],
  );

  return (
    <PaymentAmountProvider>
      <DAppDetailShell dapp={dapp} listing={listing} tabs={tabs} currentTab={tab} onTabChange={setTab}>
        {tab === 'overview' ? (
          <div className={KX_TAB_SECTION}>
            <DirectoryDAppOverviewPanel dapp={dapp} listing={listing} />
          </div>
        ) : null}
        {tab === 'about' ? (
          <div className={KX_TAB_SECTION}>
            <DirectoryDAppDescriptionsPanel dapp={dapp} listing={listing} />
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
