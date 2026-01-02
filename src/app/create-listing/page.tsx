'use client';

import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CreateListingForm } from '@/components/listings/CreateListingForm';
import { CreateListingFormData } from '@/lib/listings/types';

export default function CreateListingPage() {
  const router = useRouter();

  const handleSubmit = async (formData: CreateListingFormData) => {
    // TODO: Phase 2 - Implement actual submission flow
    // For now, just log and redirect
    console.log('Submitting listing:', formData);
    
    // Simulate submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Redirect to index (in Phase 2, redirect to listing detail page)
    router.push('/index');
  };

  const handleCancel = () => {
    router.push('/index');
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1">
        <section className="py-12 sm:py-16 lg:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                  Create New Listing
                </h1>
                <p className="text-zinc-600 dark:text-zinc-400">
                  List your dApp, token, NFT, or tool on the Kaspa ecosystem. All listings are stored on-chain via IPFS.
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
                <CreateListingForm onSubmit={handleSubmit} onCancel={handleCancel} />
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

