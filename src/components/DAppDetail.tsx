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
import { ProofOfUtility } from './dapps/ProofOfUtility';
import { getContractAddress } from '@/lib/contracts/addresses';
import { NetworkInfoMessage } from './NetworkInfoMessage';
import { getDAppNetworkType } from '@/lib/dapps';
import { GRIDHoldingsBox } from './rewards/GRIDHoldingsBox';
import { XPPointsBox } from './rewards/XPPointsBox';
import { TreasuryBox } from './treasury/TreasuryBox';
import { mergeDAppData } from '@/lib/dapps/contractData';

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
  
  // Get contract data to check for token
  // Use prop if provided, otherwise fall back to dApp's contractAddress or registry
  let contractAddress = propContractAddress || dapp.contractAddress || '';
  if (!contractAddress) {
    contractAddress = getContractAddress(chainId, 'DAppRegistry') || '';
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
  const gridTokenAddress = !isL1DApp ? (getContractAddress(chainId, 'GRIDToken') || undefined) : undefined;
  const proofOfUtilityAddress = !isL1DApp ? (getContractAddress(chainId, 'ProofOfUtility') || undefined) : undefined;

  return (
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
          <DAppWidget dapp={dapp} hideHeader />

          {/* GRID and XP Status Boxes - Side by Side */}
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

          {/* Proof of Utility - Only show for L2 dApps */}
          {!isL1DApp && proofOfUtilityAddress && (
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 p-6">
              <ProofOfUtility
                proofOfUtilityAddress={proofOfUtilityAddress}
              />
            </div>
          )}

          {/* Treasury Box - Only show for L2 dApps */}
          {!isL1DApp && (
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 p-6">
              <TreasuryBox showPerDApp />
            </div>
          )}
        </div>

        {/* Column 2 (right, narrower): Logo, Description, Costs/Fees, Revenue Tree - 2/5 width */}
        <div className="lg:col-span-2 order-2">
          <DAppRightColumn dapp={dapp} contractAddress={contractAddress} />
        </div>
      </div>
    </div>
  );
}

