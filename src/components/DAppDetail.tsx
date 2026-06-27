'use client';

import { useState } from 'react';
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
import { GameTabs } from './games/layout/GameTabs';
import { DAppDescriptionsPanel } from './dapps/panels/DAppDescriptionsPanel';
import { DAppFeesPanel } from './dapps/panels/DAppFeesPanel';
import { IconDAppWidget, IconDAppFees, IconOverview, IconComments } from './dapps/icons/DAppTabIcons';

const DAPP_TABS = [
  { id: 'widget', label: 'DApp', icon: <IconDAppWidget /> },
  { id: 'descriptions', label: 'Description', icon: <IconOverview /> },
  { id: 'fees', label: 'Fees & Costs', icon: <IconDAppFees /> },
  { id: 'comments', label: 'Comments', icon: <IconComments /> },
] as const;

type DAppTabId = (typeof DAPP_TABS)[number]['id'];

interface DAppDetailProps {
  dapp: DApp;
  contractAddress?: string;
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

  return (
    <PaymentAmountProvider>
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-10">
          <div className="space-y-6 lg:col-span-3 order-1 min-w-0">
            <GameTabs tabs={DAPP_TABS} value={tab} onChange={setTab} />

            {tab === 'widget' && <DAppWidget dapp={dapp} autoPromptWhenBlocked />}

            {tab === 'descriptions' && <DAppDescriptionsPanel dapp={mergedDApp} />}

            {tab === 'fees' && (
              <DAppFeesPanel dapp={mergedDApp} contractAddress={contractAddress} />
            )}

            {tab === 'comments' && <CommentsSection articleId={articleId} />}
          </div>

          <div className="lg:col-span-2 order-2">
            <DAppRightColumn dapp={dapp} contractAddress={contractAddress} />
          </div>
        </div>
      </div>
    </PaymentAmountProvider>
  );
}
