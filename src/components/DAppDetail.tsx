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
  
  // For KAS Tipping System, ensure KAST token is linked
  const kastTokenAddress = dapp.slug === 'kas-tipping-system' ? '0x58f026dC9985a253620C5ceDE16EC6316E5085C1' : null;
  const kastTicker = dapp.slug === 'kas-tipping-system' ? 'KAST' : null;
  
  // Merge contract data with KAST info for KAS Tipping System
  const mergedContractData = dapp.slug === 'kas-tipping-system' && kastTokenAddress ? {
    ...contractData,
    tokenAddress: contractData?.tokenAddress || kastTokenAddress,
    ticker: contractData?.ticker || kastTicker,
  } : contractData;

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

      {/* Rewards Display - Skip for KAS Tipping System (already in widget) */}
      {dapp.slug !== 'kas-tipping-system' && (gridTokenAddress || mergedContractData?.tokenAddress) && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 p-6">
          <RewardsDisplay
            gridTokenAddress={gridTokenAddress}
            dAppTokenAddress={mergedContractData?.tokenAddress || undefined}
            ticker={mergedContractData?.ticker || undefined}
          />
        </div>
      )}

      {/* Proof of Utility - Skip for KAS Tipping System (already in widget) */}
      {dapp.slug !== 'kas-tipping-system' && proofOfUtilityAddress && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 p-6">
          <ProofOfUtility
            proofOfUtilityAddress={proofOfUtilityAddress}
          />
        </div>
      )}

      {/* Affiliate Widget - Skip for KAS Tipping System (already in widget) */}
      {dapp.slug !== 'kas-tipping-system' && (
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

