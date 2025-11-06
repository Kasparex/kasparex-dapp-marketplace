'use client';

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { BuildListSidebar } from '@/components/BuildListSidebar';
import { ListDAppDashboard } from '@/components/dapps/ListDAppDashboard';

export default function ListDAppPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 flex flex-col lg:flex-row">
        {/* Sidebar */}
        <BuildListSidebar title="List dApp" />

        {/* Main Content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 lg:pl-6">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              List dApp
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 mb-8">
              Manage your dApps, track revenue, configure subscriptions, and view analytics.
            </p>
            
            <ListDAppDashboard />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
