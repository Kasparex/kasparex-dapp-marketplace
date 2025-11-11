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
  let contractAddress = dapp.contractAddress || '';
  if (!contractAddress && dapp.slug === 'kas-tipping-system') {
    contractAddress = '0x962d06f6c11A95CBc02D5f965135368492d37Fd3'; // KASTip contract
  }
  if (!contractAddress) {
    contractAddress = getContractAddress(chainId, 'DAppRegistry') || '';
  }
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
      {(gridTokenAddress || contractData?.tokenAddress || (dapp.slug === 'kas-tipping-system' && '0x58f026dC9985a253620C5ceDE16EC6316E5085C1')) && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 p-6">
          <RewardsDisplay
            gridTokenAddress={gridTokenAddress}
            dAppTokenAddress={dapp.slug === 'kas-tipping-system' ? '0x58f026dC9985a253620C5ceDE16EC6316E5085C1' : (contractData?.tokenAddress || undefined)}
            ticker={dapp.slug === 'kas-tipping-system' ? 'KAST' : (contractData?.ticker || undefined)}
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
      {dapp.slug === 'kas-tipping-system' ? (
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 p-6">
          <AffiliateWidget
            affiliateManagerAddress={getContractAddress(chainId, 'AffiliateManager') || undefined}
            dAppContractAddress={contractAddress}
          />
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 p-6">
          <AffiliateWidget
            dAppId={dapp.id}
            dAppName={dapp.name}
          />
        </div>
      )}
    </div>
  );
}

