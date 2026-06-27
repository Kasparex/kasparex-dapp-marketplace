'use client';

import { useMemo, useState } from 'react';
import { useChainId } from 'wagmi';
import { DApp } from '@/lib/dapps';
import { DAppWidget } from './DAppWidget';
import { useDAppFromContract } from '@/lib/dapps/contractData';
import { getContractAddress } from '@/lib/contracts/addresses';
import { getDAppContractAddress } from '@/lib/dapps/contractResolver';
import { CommentsSection } from './vblog/CommentsSection';
import { mergeDAppData } from '@/lib/dapps/contractData';
import { PaymentAmountProvider } from '@/lib/dapps/PaymentAmountContext';
import { DAppRightColumn } from './dapps/DAppRightColumn';
import { DAppDescriptionsPanel } from './dapps/panels/DAppDescriptionsPanel';
import { DAppFeesPanel } from './dapps/panels/DAppFeesPanel';
import { IconDAppWidget, IconDAppFees, IconOverview, IconComments } from './dapps/icons/DAppTabIcons';
import { DAppsWithSidebarLayout } from './dapps/layout/DAppsWithSidebarLayout';
import { useDAppCommentsCount } from '@/hooks/useDAppCommentsCount';
import type { DAppTab } from './dapps/layout/DAppTabs';

const BASE_TABS = [
  { id: 'widget', label: 'DApp', icon: <IconDAppWidget /> },
  { id: 'descriptions', label: 'Description', icon: <IconOverview /> },
  { id: 'fees', label: 'Fees & Costs', icon: <IconDAppFees /> },
  { id: 'comments', label: 'Comments', icon: <IconComments /> },
] as const;

type DAppTabId = (typeof BASE_TABS)[number]['id'];

interface DAppDetailProps {
  dapp: DApp;
  contractAddress?: string;
}

function CommentsTabBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-cyan-500/15 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-cyan-800 dark:text-cyan-300">
      {count}
    </span>
  );
}

export function DAppDetail({ dapp, contractAddress: propContractAddress }: DAppDetailProps) {
  const chainId = useChainId();
  const [tab, setTab] = useState<DAppTabId>('widget');

  let contractAddress = propContractAddress || dapp.contractAddress || '';
  if (!contractAddress && chainId) {
    contractAddress = getDAppContractAddress(dapp, chainId) || '';
    if (!contractAddress) {
      contractAddress = getContractAddress(chainId, 'DAppRegistry') || '';
    }
  }
  const { data: contractData } = useDAppFromContract(
    contractAddress?.startsWith('0x') ? contractAddress : undefined,
    chainId,
  );

  const mergedDApp = mergeDAppData(contractData, dapp);
  const articleId = `dapp:${dapp.slug || dapp.id || 'unknown'}`;
  const commentsCount = useDAppCommentsCount(articleId);

  const tabs = useMemo((): readonly DAppTab<DAppTabId>[] => {
    return BASE_TABS.map((t) =>
      t.id === 'comments'
        ? { ...t, rightAdornment: <CommentsTabBadge count={commentsCount} /> }
        : t,
    );
  }, [commentsCount]);

  return (
    <PaymentAmountProvider>
      <DAppsWithSidebarLayout
        tabs={tabs}
        currentTab={tab}
        onTabChange={setTab}
        main={
          <>
            {tab === 'widget' && <DAppWidget dapp={dapp} autoPromptWhenBlocked />}
            {tab === 'descriptions' && <DAppDescriptionsPanel dapp={mergedDApp} />}
            {tab === 'fees' && <DAppFeesPanel dapp={mergedDApp} contractAddress={contractAddress} />}
            {tab === 'comments' && <CommentsSection articleId={articleId} dappSectionHeader />}
          </>
        }
        sidebar={<DAppRightColumn dapp={dapp} contractAddress={contractAddress} />}
      />
    </PaymentAmountProvider>
  );
}
