'use client';

import { DApp } from '@/lib/dapps';
import { useDAppFeeCalculations } from '@/hooks/useDAppFeeCalculations';
import { getExplorerUrl } from '@/lib/dapps/deployer';

interface DAppDescriptionsPanelProps {
  dapp: DApp;
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
        {icon}
        {title}
      </h3>
      <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line">{children}</p>
    </div>
  );
}

const infoIcon = (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const utilityIcon = (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const processIcon = (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const benefitsIcon = (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const securityIcon = (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

export function DAppDescriptionsPanel({ dapp }: DAppDescriptionsPanelProps) {
  const hasContent = dapp.description || dapp.utility || dapp.process || dapp.benefits || dapp.security;

  if (!hasContent) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400 py-4">No description available for this dApp.</p>
    );
  }

  return (
    <div className="space-y-6">
      {dapp.description ? (
        <Section title="Description" icon={infoIcon}>
          {dapp.description}
        </Section>
      ) : null}
      {dapp.utility ? (
        <Section title="Utility" icon={utilityIcon}>
          {dapp.utility}
        </Section>
      ) : null}
      {dapp.process ? (
        <Section title="How to Use" icon={processIcon}>
          {dapp.process}
        </Section>
      ) : null}
      {dapp.benefits ? (
        <Section title="Benefits" icon={benefitsIcon}>
          {dapp.benefits}
        </Section>
      ) : null}
      {dapp.security ? (
        <Section title="Security" icon={securityIcon}>
          {dapp.security}
        </Section>
      ) : null}
    </div>
  );
}

/** Timeline sidebar used alongside fees table (shared with fees panel). */
export function DAppInfoTimeline({
  dapp,
  contractAddress,
}: {
  dapp: DApp;
  contractAddress?: string;
}) {
  const {
    chainId,
    isL1DApp,
    contractData,
    gridTokenAddress,
    feeHandlerAddress,
    rewardManagerAddress,
    resolvedContractAddress,
  } = useDAppFeeCalculations(dapp, contractAddress);

  const formatAddress = (address: string | null) => {
    if (!address || !address.startsWith('0x')) return null;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getExplorerLink = (address: string | undefined) => {
    if (!address || !address.startsWith('0x')) return null;
    return getExplorerUrl(address, chainId);
  };

  const formatTokenSupply = (supply: bigint | null | undefined) => {
    if (!supply) return 'N/A';
    return (Number(supply) / 1e18).toLocaleString(undefined, { maximumFractionDigits: 0 });
  };

  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-zinc-200 dark:bg-zinc-700" />
      <div className="space-y-6">
        <div className="relative pl-12">
          <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-[#02abb8] flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Fees</h4>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-2">
            Small fee supports the Kasparex ecosystem infrastructure and development.
          </p>
          {feeHandlerAddress ? (
            <a
              href={getExplorerLink(feeHandlerAddress)!}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-[#02abb8] hover:underline"
            >
              {formatAddress(feeHandlerAddress)}
            </a>
          ) : null}
        </div>

        {(contractData?.tokenAddress || gridTokenAddress) ? (
          <div className="relative pl-12">
            <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
            </div>
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Rewards</h4>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-2">Earn tokens through Proof-of-Utility interactions:</p>
            <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1 mb-2">
              {contractData?.tokenAddress && contractData.ticker ? (
                <li>• {contractData.ticker} tokens</li>
              ) : null}
              {gridTokenAddress ? <li>• GRID tokens</li> : null}
            </ul>
            {rewardManagerAddress ? (
              <a
                href={getExplorerLink(rewardManagerAddress)!}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-[#02abb8] hover:underline"
              >
                {formatAddress(rewardManagerAddress)}
              </a>
            ) : null}
          </div>
        ) : null}

        {contractData?.tokenAddress && contractData.ticker ? (
          <div className="relative pl-12">
            <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">{contractData.ticker} Token</h4>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">
              Total Supply: {formatTokenSupply(contractData.totalSupply)} {contractData.ticker}
            </p>
            <a
              href={getExplorerLink(contractData.tokenAddress)!}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-[#02abb8] hover:underline"
            >
              {formatAddress(contractData.tokenAddress)}
            </a>
          </div>
        ) : null}

        {gridTokenAddress && !isL1DApp ? (
          <div className="relative pl-12">
            <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">GRID Token</h4>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-2">Ecosystem reward token earned across all dApps.</p>
            <a
              href={getExplorerLink(gridTokenAddress)!}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-[#02abb8] hover:underline"
            >
              {formatAddress(gridTokenAddress)}
            </a>
          </div>
        ) : null}

        {resolvedContractAddress && resolvedContractAddress.startsWith('0x') ? (
          <div className="relative pl-12">
            <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-zinc-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">dApp Contract</h4>
            <a
              href={getExplorerLink(resolvedContractAddress)!}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-[#02abb8] hover:underline break-all"
            >
              {resolvedContractAddress}
            </a>
          </div>
        ) : null}
      </div>
    </div>
  );
}
