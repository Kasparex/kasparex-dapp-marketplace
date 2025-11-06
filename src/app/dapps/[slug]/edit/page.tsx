'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { placeholderDApps } from '@/lib/dapps';
import { getDAppBySlug } from '@/lib/utils';
import { canEditDApp } from '@/lib/dapps/management';
import { EditDAppModal } from '@/components/dapps/EditDAppModal';
import { useDAppFromContract } from '@/lib/dapps/contractData';
import { getContractAddress } from '@/lib/contracts/addresses';
import { useChainId } from 'wagmi';

export default function DAppEditPage() {
  const params = useParams();
  const router = useRouter();
  const { address: connectedAddress, isConnected } = useAccount();
  const chainId = useChainId();
  const slug = params?.slug as string | undefined;
  
  const dapp = slug ? getDAppBySlug(placeholderDApps, slug) : undefined;

  if (!dapp || !slug) {
    notFound();
  }

  // Check if user can edit
  const canEdit = canEditDApp(connectedAddress, dapp);

  // Get contract address
  let contractAddress = dapp.contractAddress || '';
  if (!contractAddress && dapp.slug === 'simple-payment') {
    try {
      contractAddress = getContractAddress(chainId, 'SimplePayment') || '';
    } catch (e) {
      console.warn('Could not get SimplePayment contract address');
    }
  }

  // Fetch contract data
  const { data: contractData } = useDAppFromContract(
    contractAddress && contractAddress.startsWith('0x') ? contractAddress : undefined,
    chainId
  );

  // Redirect if not authorized
  useEffect(() => {
    if (isConnected && !canEdit) {
      router.push(`/dapps/${slug}`);
    }
  }, [isConnected, canEdit, router, slug]);

  if (!isConnected) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              Connect Your Wallet
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              Please connect your wallet to edit this dApp.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              Unauthorized
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              You don't have permission to edit this dApp. Only the deployer can edit it.
            </p>
            <button
              onClick={() => router.push(`/dapps/${slug}`)}
              className="px-4 py-2 bg-[#02abb8] text-white rounded-lg hover:bg-[#0299a3] transition-colors"
            >
              Back to dApp
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <button
              onClick={() => router.push(`/dapps/${slug}`)}
              className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors mb-4 inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to dApp
            </button>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              Edit {dapp.name}
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Update your dApp information, links, and settings.
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
            <EditDAppModal
              dapp={dapp}
              contractAddress={contractAddress}
              contractData={contractData}
              onClose={() => router.push(`/dapps/${slug}`)}
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

