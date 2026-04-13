'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { BuildListSidebar } from '@/components/BuildListSidebar';
import { BuildDAppWizard } from '@/components/dapps/BuildDAppWizard';
import { DApp } from '@/lib/dapps';
import { placeholderDApps } from '@/lib/dapps';

export default function BuildDAppPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleComplete = async (dapp: Partial<DApp>) => {
    setIsSubmitting(true);

    try {
      // Save to localStorage (for now - in future, could save to backend)
      const key = `dapp_${dapp.id}_metadata`;
      localStorage.setItem(key, JSON.stringify(dapp));

      // Add to placeholderDApps array (in memory only - would need backend for persistence)
      // For now, we'll just save to localStorage and redirect
      
      // Show success message
      alert('dApp created successfully! You can now view it in the List dApp dashboard.');

      // Redirect to list-dapp page
      router.push('/list-dapp');
    } catch (error) {
      console.error('Error saving dApp:', error);
      alert('Failed to save dApp. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel? Your progress will be lost.')) {
      router.push('/dapps');
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 flex flex-col lg:flex-row">
        {/* Sidebar */}
        <BuildListSidebar title="Build dApp" />

        {/* Main Content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 lg:pl-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              Build dApp
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 mb-8">
              Create and deploy your dApp on the Kasparex marketplace. Follow the steps below to get started.
            </p>
            
            <BuildDAppWizard onComplete={handleComplete} onCancel={handleCancel} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
