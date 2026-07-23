import { Metadata } from 'next';
import { Suspense } from 'react';
import { NodesDashboardContent } from '@/components/nodes/NodesDashboardContent';

export const metadata: Metadata = {
  title: 'Nodes',
  description: 'Manage your KREX node: connect, monitor status, and track incentives.',
};

export default function NodesDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-16 text-zinc-500 dark:text-zinc-400">
          Loading nodes dashboard…
        </div>
      }
    >
      <NodesDashboardContent />
    </Suspense>
  );
}
