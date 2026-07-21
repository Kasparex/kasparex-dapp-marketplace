'use client';

import { Suspense } from 'react';
import { DAppPageShell } from '@/components/dapps/DAppPageShell';
import { DAppDashboardContent } from '@/components/dapps/DAppDashboardContent';

export default function DAppsDashboardPage() {
  return (
    <Suspense
      fallback={
        <DAppPageShell sidebar={{ dashboardTab: 'create' }}>
          <div className="py-20 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500" />
          </div>
        </DAppPageShell>
      }
    >
      <DAppDashboardContent />
    </Suspense>
  );
}
