'use client';

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { NodesDashboardSidebar } from '@/components/nodes/NodesDashboardSidebar';

export default function NodesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
      <Header />

      <div className="flex flex-1">
        <div className="hidden lg:block flex-shrink-0">
          <NodesDashboardSidebar />
        </div>
        <div className="lg:hidden flex-shrink-0">
          <NodesDashboardSidebar />
        </div>
        <main className="flex-1 w-full p-4 sm:p-6 lg:p-12 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
