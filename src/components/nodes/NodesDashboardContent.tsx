'use client';

import { useEffect } from 'react';
import { ConnectAndRegister } from './ConnectAndRegister';
import { NodeTypeCard } from './NodeTypeCard';
import { StatusAndParameters } from './StatusAndParameters';
import { TechnicalRequirements } from './TechnicalRequirements';
import { IncentivesAndEarnings } from './IncentivesAndEarnings';
import {
  mockNodeInfo,
  mockNodeMetrics,
  mockIncentives,
  mockTechnicalRequirements,
} from '@/lib/nodes/mock';

export function NodesDashboardContent() {
  useEffect(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash.slice(1) : '';
    if (hash) {
      const el = document.getElementById(hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, []);

  return (
    <div className="space-y-2">
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
        Kasparex Nodes
      </h1>
      <p className="text-zinc-600 dark:text-zinc-400 mb-8 max-w-2xl">
        Manage your KREX node: connect and register, monitor status, and track
        incentives. All data below is placeholder until the node system is
        wired.
      </p>

      <ConnectAndRegister nodeInfo={mockNodeInfo} />
      <NodeTypeCard nodeType={mockNodeInfo.status !== 'not_registered' ? mockNodeInfo.type : null} />
      <StatusAndParameters nodeInfo={mockNodeInfo} metrics={mockNodeMetrics} />
      <TechnicalRequirements requirements={mockTechnicalRequirements} />
      <IncentivesAndEarnings incentives={mockIncentives} />
    </div>
  );
}
