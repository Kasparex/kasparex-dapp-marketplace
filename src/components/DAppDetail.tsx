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

      {/* Two Column Layout: Info (left) | Widget (right) - widget on right for better focus */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
        {/* Column 1 (left): Logo, Description, Costs/Fees, Revenue Tree */}
        <div className="order-2 lg:order-1">
          <DAppRightColumn dapp={dapp} contractAddress={contractAddress} />
        </div>

        {/* Column 2 (right): dApp Widget and related boxes */}
        <div className="space-y-6 order-1 lg:order-2">
          <DAppWidget dapp={dapp} hideHeader />

          {/* GRID Holdings - GRT-only */}
          <div>
            <GRIDHoldingsBox />
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
      </div>
    </div>
  );
}

