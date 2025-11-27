'use client';

import { useState } from 'react';
import { useChainId } from 'wagmi';
import { DApp } from '@/lib/dapps';
import { DAppWidget } from './DAppWidget';
import { NetworkCompatibilityModal } from './NetworkCompatibilityModal';
import { useNetworkCompatibility } from '@/hooks/useNetworkCompatibility';
import { useDAppFromContract } from '@/lib/dapps/contractData';
import { TokenDisplay } from './dapps/TokenDisplay';
import { ProofOfUtility } from './dapps/ProofOfUtility';
import { getContractAddress } from '@/lib/contracts/addresses';

interface DAppDetailProps {
  dapp: DApp;
}

export function DAppDetail({ dapp }: DAppDetailProps) {
  const [showCompatibilityModal, setShowCompatibilityModal] = useState(false);
  const compatibility = useNetworkCompatibility(dapp);
  const chainId = useChainId();
  
  // Get contract data to check for token
  let contractAddress = dapp.contractAddress || '';
  if (!contractAddress) {
    contractAddress = getContractAddress(chainId, 'DAppRegistry') || '';
  }
  const { data: contractData } = useDAppFromContract(
    contractAddress?.startsWith('0x') ? contractAddress : undefined,
    chainId
  );
  
  // Use contract data as-is
  const mergedContractData = contractData;

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
      {mergedContractData?.tokenAddress && mergedContractData.ticker && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 p-6">
          <TokenDisplay
            tokenAddress={mergedContractData.tokenAddress}
            ticker={mergedContractData.ticker}
            totalSupply={mergedContractData.totalSupply?.toString() || '0'}
            dAppName={dapp.name}
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

    </div>
  );
}

