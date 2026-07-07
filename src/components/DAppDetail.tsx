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
import { DAppWidgetActionRailProvider } from '@/lib/dapps/DAppWidgetActionRailContext';
import { DAppDescriptionsPanel } from './dapps/panels/DAppDescriptionsPanel';
import { DAppRevenueTreePanel } from './dapps/panels/DAppRevenueTreePanel';
import { IconComments } from './dapps/icons/DAppTabIcons';
import { useDAppCommentsCount } from '@/hooks/useDAppCommentsCount';
import { DAppDetailShell } from './dapps/shell/DAppDetailShell';
import { DAppDetailProvider } from './dapps/shell/DAppDetailContext';
import { KX_TAB_SECTION } from '@/lib/hub/shellTokens';
import {
  buildDAppDetailTabs,
  defaultDAppDetailTab,
  isWidgetPageTab,
} from '@/lib/dapps/buildDAppDetailTabs';
import { isWidgetCalculationTab } from '@/lib/dapps/widgetPageTabs';
import {
  DAppWidgetSectionProvider,
  DAppWidgetTabLabelProvider,
  useWidgetTabLabelOverrides,
} from '@/lib/dapps/DAppWidgetTabContext';

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

function DAppDetailBody({
  dapp,
  mergedDApp,
  contractAddress,
}: {
  dapp: DApp;
  mergedDApp: DApp;
  contractAddress: string;
}) {
  const [tab, setTab] = useState(() => defaultDAppDetailTab(dapp.slug));
  const labelOverrides = useWidgetTabLabelOverrides();
  const articleId = `dapp:${dapp.slug || dapp.id || 'unknown'}`;
  const commentsCount = useDAppCommentsCount(articleId);

  const tabs = useMemo(
    () =>
      buildDAppDetailTabs({
        dapp: mergedDApp,
        commentsCount,
        commentsBadge: <CommentsTabBadge count={commentsCount} />,
        labelOverrides,
      }),
    [mergedDApp, commentsCount, labelOverrides],
  );

  const showCalculationPanel = isWidgetCalculationTab(tab, dapp.slug);
  const widgetSection = isWidgetPageTab(tab, dapp.slug) ? tab : null;

  return (
    <DAppDetailShell
      dapp={mergedDApp}
      contractAddress={contractAddress}
      tabs={tabs}
      currentTab={tab}
      onTabChange={setTab}
      showCalculationPanel={showCalculationPanel}
    >
      {widgetSection ? (
        <DAppWidgetSectionProvider section={widgetSection} onNavigate={setTab}>
          <div className={KX_TAB_SECTION}>
            <DAppWidget dapp={dapp} variant="detail" autoPromptWhenBlocked hideHeader hideFooter hideFooterMetaRow />
          </div>
        </DAppWidgetSectionProvider>
      ) : null}
      {tab === 'descriptions' ? (
        <div className={KX_TAB_SECTION}>
          <DAppDescriptionsPanel dapp={mergedDApp} contractAddress={contractAddress} />
        </div>
      ) : null}
      {tab === 'revenue-tree' ? (
        <div className={KX_TAB_SECTION}>
          <DAppRevenueTreePanel dapp={mergedDApp} />
        </div>
      ) : null}
      {tab === 'comments' ? (
        <div className={KX_TAB_SECTION}>
          <CommentsSection articleId={articleId} dappSectionHeader />
        </div>
      ) : null}
    </DAppDetailShell>
  );
}

export function DAppDetail({ dapp, contractAddress: propContractAddress }: DAppDetailProps) {
  const chainId = useChainId();

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

  return (
    <PaymentAmountProvider>
      <DAppWidgetActionRailProvider>
        <DAppWidgetTabLabelProvider>
          <DAppDetailProvider dapp={dapp} mergedDApp={mergedDApp} contractAddress={contractAddress}>
            <DAppDetailBody dapp={dapp} mergedDApp={mergedDApp} contractAddress={contractAddress} />
          </DAppDetailProvider>
        </DAppWidgetTabLabelProvider>
      </DAppWidgetActionRailProvider>
    </PaymentAmountProvider>
  );
}
