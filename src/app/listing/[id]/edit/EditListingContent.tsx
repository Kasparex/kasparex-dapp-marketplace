'use client';

import { useRouter } from 'next/navigation';
import { CreateListingForm } from '@/components/listings/CreateListingForm';
import { mockListings } from '@/lib/listings/mockData';
import { CreateListingFormData } from '@/lib/listings/types';

interface EditListingContentProps {
  id: string;
}

export function EditListingContent({ id }: EditListingContentProps) {
  const router = useRouter();
  
  const listing = mockListings.find(l => l.id === id);

  if (!listing) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">Listing Not Found</h1>
          <button
            onClick={() => router.push('/index')}
            className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            Back to Index
          </button>
        </div>
      </main>
    );
  }

  const handleSubmit = async (formData: CreateListingFormData) => {
    // TODO: Phase 2 - Implement actual update flow
    console.log('Updating listing:', id, formData);
    
    // Simulate update
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Redirect to listing detail page
    router.push(`/listing/${id}`);
  };

  const handleCancel = () => {
    router.push(`/listing/${id}`);
  };

  // Convert listing to form data
  const initialData: Partial<CreateListingFormData> = {
    name: listing.name,
    description: listing.description,
    category: listing.category,
    tags: listing.tags,
    links: listing.links,
  };

  return (
    <main className="flex-1">
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                Edit Listing
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400">
                Update your listing information. Changes will create a new transaction.
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
              <CreateListingForm
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                initialData={initialData}
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

