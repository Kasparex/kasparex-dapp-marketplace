'use client';

import { useState } from 'react';
import { useChainId } from 'wagmi';
import { DApp } from '@/lib/dapps';
import { DAppWidget } from './DAppWidget';
import { NetworkCompatibilityModal } from './NetworkCompatibilityModal';
import { useNetworkCompatibility } from '@/hooks/useNetworkCompatibility';
import { useNetworkAwareWallet } from '@/hooks/useNetworkAwareWallet';
import { useDAppFromContract } from '@/lib/dapps/contractData';
import { TokenDisplay } from './dapps/TokenDisplay';
import { getContractAddress } from '@/lib/contracts/addresses';
import { getDAppContractAddress } from '@/lib/dapps/contractResolver';
import { NetworkInfoMessage } from './NetworkInfoMessage';
import { getDAppNetworkType } from '@/lib/dapps';
import { GRIDHoldingsBox } from './rewards/GRIDHoldingsBox';
import { XPPointsBox } from './rewards/XPPointsBox';
import { CommentsSection } from './vblog/CommentsSection';
import { mergeDAppData } from '@/lib/dapps/contractData';
import { PaymentAmountProvider } from '@/lib/dapps/PaymentAmountContext';

import { DAppRightColumn } from './dapps/DAppRightColumn';

interface DAppDetailProps {
  dapp: DApp;
  contractAddress?: string;
}

export function DAppDetail({ dapp, contractAddress: propContractAddress }: DAppDetailProps) {
  const [showCompatibilityModal, setShowCompatibilityModal] = useState(false);
  const compatibility = useNetworkCompatibility(dapp);
  const networkWallet = useNetworkAwareWallet(dapp);
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
    chainId
  );
  
  // Use contract data as-is
  const mergedContractData = contractData;
  const mergedDApp = mergeDAppData(contractData, dapp);

  // Get contract addresses for token components (only for L2 dApps)
  const isL1DApp = getDAppNetworkType(dapp) === 'L1';

  return (
    <PaymentAmountProvider>
    <div className="space-y-6">
      <NetworkCompatibilityModal
        dapp={dapp}
        isOpen={showCompatibilityModal}
        onClose={() => setShowCompatibilityModal(false)}
      />

      {/* Two Column Layout: Widget (left, wider) | Info (right) - widget focus on utility */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-10">
        {/* Column 1 (left, wider): dApp Widget and related boxes - 3/5 width */}
        <div className="space-y-6 lg:col-span-3 order-1">
          <DAppWidget dapp={dapp} />

          {/* GRID and hub pts status boxes - side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GRIDHoldingsBox />
            <XPPointsBox />
          </div>

          {/* Token Information - Only show for L2 dApps */}
          {!isL1DApp && mergedContractData?.tokenAddress && mergedContractData.ticker && (
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 p-6">
              <TokenDisplay
                tokenAddress={mergedContractData.tokenAddress}
                ticker={mergedContractData.ticker}
                totalSupply={mergedContractData.totalSupply?.toString() || '0'}
                dAppName={dapp.name}
              />
            </div>
          )}

          {/* Comments - same location as before, no box */}
          <div className="mt-8">
            <CommentsSection articleId={`dapp:${dapp.slug || dapp.id || 'unknown'}`} />
          </div>
        </div>

        {/* Column 2 (right, narrower): Logo, Description, Costs/Fees, Revenue Tree - 2/5 width */}
        <div className="lg:col-span-2 order-2">
          <DAppRightColumn dapp={dapp} contractAddress={contractAddress} />
        </div>
      </div>
    </div>
    </PaymentAmountProvider>
  );
}

