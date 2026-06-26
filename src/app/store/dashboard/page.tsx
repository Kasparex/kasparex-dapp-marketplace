'use client';

import { Suspense } from 'react';
import { StorePageShell } from '@/components/store/StorePageShell';
import { StoreSellerHubContent } from '@/components/store/StoreSellerHubContent';

export default function SellerDashboardPage() {
  return (
    <Suspense
      fallback={
        <StorePageShell sidebar={{ mode: 'dashboard' }}>
          <div className="py-20 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500" />
          </div>
        </StorePageShell>
      }
    >
      <StoreSellerHubContent />
    </Suspense>
  );
}
