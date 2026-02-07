'use client';

import { StoreProductForm } from '@/components/store/StoreProductForm';

export default function StudioStorePage() {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="mb-12">
                <h2 className="text-3xl font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tighter mb-2">
                    Store Product Listing
                </h2>
                <p className="text-zinc-500 dark:text-zinc-400 font-medium">
                    List your digital assets, software, or art on the Kasparex Store and earn KAS.
                </p>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[32px] p-8 shadow-sm">
                <StoreProductForm />
            </div>
        </div>
    );
}
