'use client';

import { useState } from 'react';
import { useChainId } from 'wagmi';
import { DApp } from '@/lib/dapps';
import { DAppWidget } from './DAppWidget';
import { NetworkCompatibilityModal } from './NetworkCompatibilityModal';
import { useNetworkCompatibility } from '@/hooks/useNetworkCompatibility';
import { useDAppFromContract } from '@/lib/dapps/contractData';
import { TokenDisplay } from './dapps/TokenDisplay';
import { RewardsDisplay } from './dapps/RewardsDisplay';
import { ProofOfUtility } from './dapps/ProofOfUtility';
import { AffiliateWidget } from './dapps/AffiliateWidget';
import { getContractAddress } from '@/lib/contracts/addresses';

interface DAppDetailProps {
  dapp: DApp;
}

export function DAppDetail({ dapp }: DAppDetailProps) {
  const [showCompatibilityModal, setShowCompatibilityModal] = useState(false);
  const compatibility = useNetworkCompatibility(dapp);
  const chainId = useChainId();
  
  // Get contract data to check for token
  const contractAddress = dapp.contractAddress || getContractAddress(chainId, 'DAppRegistry') || '';
  const { data: contractData } = useDAppFromContract(
    contractAddress?.startsWith('0x') ? contractAddress : undefined,
    chainId
  );

  // Get contract addresses for token components
  const gridTokenAddress = getContractAddress(chainId, 'GRIDToken') || undefined;
  const proofOfUtilityAddress = getContractAddress(chainId, 'ProofOfUtility') || undefined;

  return (
    <div className="space-y-6">
      <NetworkCompatibilityModal
        dapp={dapp}
        isOpen={showCompatibilityModal}
        onClose={() => setShowCompatibilityModal(false)}
      />

      {/* dApp Widget */}
      <DAppWidget dapp={dapp} />

      {/* Token Information */}
      {contractData?.tokenAddress && contractData.ticker && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 p-6">
          <TokenDisplay
            tokenAddress={contractData.tokenAddress}
            ticker={contractData.ticker}
            totalSupply={contractData.totalSupply?.toString() || '0'}
            dAppName={dapp.name}
          />
        </div>
      )}

      {/* Rewards Display */}
      {(gridTokenAddress || contractData?.tokenAddress) && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 p-6">
          <RewardsDisplay
            gridTokenAddress={gridTokenAddress}
            dAppTokenAddress={contractData?.tokenAddress || undefined}
            ticker={contractData?.ticker || undefined}
          />
        </div>
      )}

      {/* Proof of Utility */}
      {proofOfUtilityAddress && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 p-6">
          <ProofOfUtility
            proofOfUtilityAddress={proofOfUtilityAddress}
          />
        </div>
      )}

      {/* Affiliate Widget */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 p-6">
        <AffiliateWidget
          dAppId={dapp.id}
          dAppName={dapp.name}
        />
      </div>
    </div>
  );
}

