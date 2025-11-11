/**
 * Token Deployment Page
 * UI for deploying tokens when creating dApps
 */

'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { TokenDeploymentWizard } from '@/components/dapps/TokenDeploymentWizard';

// Force dynamic rendering to avoid SSR issues with indexedDB
export const dynamic = 'force-dynamic';

function DeployTokenContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dAppId = searchParams.get('dappId') || '';
  const dAppName = searchParams.get('dappName') || 'dApp';

  const handleComplete = (tokenAddress: string) => {
    // Redirect to dApp page or show success
    router.push(`/dapps/${dAppId}?token=${tokenAddress}`);
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
      <TokenDeploymentWizard
        dAppId={dAppId}
        dAppName={dAppName}
        onComplete={handleComplete}
        onCancel={handleCancel}
      />
    </main>
  );
}

export default function DeployTokenPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <Suspense fallback={
        <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
          <div className="text-center text-zinc-500 dark:text-zinc-400">Loading...</div>
        </main>
      }>
        <DeployTokenContent />
      </Suspense>
      <Footer />
    </div>
  );
}

