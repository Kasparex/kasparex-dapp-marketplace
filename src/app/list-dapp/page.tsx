'use client';

import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { SidebarHeader } from '@/components/sidebar/SidebarHeader';
import { SidebarSection } from '@/components/sidebar/SidebarSection';

export default function ListDAppPage() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
      <Header />

      <main className="flex-1 flex flex-col lg:flex-row">
        <div className="hidden lg:block flex-shrink-0">
          <UnifiedSidebar
            storageKeyPrefix="list-dapp"
            header={(onHide) => <SidebarHeader backHref="/dapps" backLabel="Back to dApps" onHide={onHide} />}
          >
            <SidebarSection title="Quick actions" className="mb-8">
              <div className="space-y-2">
                <Link href="/list-dapp" className="k-control-btn w-full">
                  List dApp
                </Link>
                <Link href="/dashboard" className="k-control-btn w-full">
                  Revenue Tree
                </Link>
                <Link href="/modules" className="k-control-btn w-full">
                  Modules
                </Link>
              </div>
            </SidebarSection>
          </UnifiedSidebar>
        </div>

        <div className="lg:hidden flex-shrink-0">
          <UnifiedSidebar
            storageKeyPrefix="list-dapp"
            header={(onHide) => <SidebarHeader backHref="/dapps" backLabel="Back to dApps" onHide={onHide} />}
          >
            <SidebarSection title="Quick actions" className="mb-8">
              <div className="space-y-2">
                <Link href="/list-dapp" className="k-control-btn w-full">
                  List dApp
                </Link>
                <Link href="/dashboard" className="k-control-btn w-full">
                  Revenue Tree
                </Link>
                <Link href="/modules" className="k-control-btn w-full">
                  Modules
                </Link>
              </div>
            </SidebarSection>
          </UnifiedSidebar>
        </div>

        <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-12 overflow-y-auto border-l border-zinc-200 dark:border-zinc-800">
          <div className="max-w-5xl mx-auto">
            {/* Intentionally empty for now. */}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
