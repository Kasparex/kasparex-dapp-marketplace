'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { StorePageShell } from '@/components/store/StorePageShell';
import { StoreProductForm } from '@/components/store/StoreProductForm';
import { HubWalletGateShell } from '@/components/hub/HubWalletGateShell';
import { STORE_DASHBOARD_GATE } from '@/lib/hub/gateConfigs';

function CreateProductContent() {
  return (
    <>
      <div className="mb-10">
        <p className="text-sm font-black uppercase tracking-widest text-[#02abb8] mb-2">Seller tools</p>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-zinc-900 dark:text-zinc-100 mb-3 tracking-tight">
          List a <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-emerald-500">product</span>
        </h1>
        <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-3xl">
          Publish digital assets to the Kasparex Store. Upload files, set your price in KAS, and reach buyers across the ecosystem.
        </p>
      </div>

      <HubWalletGateShell mode="replace" config={STORE_DASHBOARD_GATE}>
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8">
          <StoreProductForm />
        </div>
      </HubWalletGateShell>

      <p className="mt-6 text-sm text-zinc-500">
        Already listed something?{' '}
        <Link href="/store/dashboard" className="font-bold text-[#02abb8] hover:underline">
          Open seller dashboard
        </Link>
      </p>
    </>
  );
}

export default function StoreCreatePage() {
  return (
    <Suspense
      fallback={
        <StorePageShell sidebar={{ mode: 'listing' }}>
          <div className="py-20 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500" />
          </div>
        </StorePageShell>
      }
    >
      <StorePageShell sidebar={{ mode: 'listing' }}>
        <CreateProductContent />
      </StorePageShell>
    </Suspense>
  );
}
