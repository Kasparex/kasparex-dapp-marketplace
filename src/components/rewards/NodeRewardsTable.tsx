'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { NodeSetupWizard } from './NodeSetupWizard';
import { RewardTooltip } from './RewardTooltip';
import { LIGHT_NODE_COST_REDUCTION, MIRROR_NODE_COST_REDUCTION } from '@/lib/rewards/types';

interface NodeRewardsTableProps {
  hasNode: boolean;
  nodeType?: 'light' | 'mirror';
}

const NODE_TYPES = {
  light: { name: 'Light Node', multiplier: 4, feeReduction: 0.1, costReduction: LIGHT_NODE_COST_REDUCTION },
  mirror: { name: 'Mirror Node', multiplier: 5, feeReduction: 0.2, costReduction: MIRROR_NODE_COST_REDUCTION },
};

export function NodeRewardsTable({ hasNode, nodeType }: NodeRewardsTableProps) {
  const [showNodeWizard, setShowNodeWizard] = useState(false);
  const nodeTypes = [
    {
      id: 'light',
      ...NODE_TYPES.light,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      isUnlocked: hasNode && nodeType === 'light',
    },
    {
      id: 'mirror',
      ...NODE_TYPES.mirror,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
      isUnlocked: hasNode && nodeType === 'mirror',
    },
  ];

  const benefitRows = [
    { 
      id: 'requirements', 
      label: 'Requirements', 
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      tooltip: 'Node setup requirements. You need to run an active Light or Mirror node to unlock node provider rewards.',
    },
    { 
      id: 'multiplier', 
      label: 'Multiplier', 
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      tooltip: 'Reward multiplier that increases your GRID and dApp token earnings. Mirror nodes provide higher multipliers than Light nodes.',
    },
    { 
      id: 'feeReduction', 
      label: 'Fee Reduction', 
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      tooltip: 'Percentage reduction applied to transaction fees. Node providers receive additional fee savings on all dApp interactions.',
    },
  ];

  const getCellValue = (nodeType: typeof nodeTypes[0], rowId: string) => {
    switch (rowId) {
      case 'requirements':
        return `Active ${nodeType.name}`;
      case 'multiplier':
        return `${nodeType.multiplier}x`;
      case 'feeReduction':
        return `-${nodeType.feeReduction}%`;
      default:
        return '-';
    }
  };

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-zinc-200/50 dark:border-zinc-800/50">
        <table className="w-full border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-zinc-50/30 dark:bg-zinc-900/30">
              <th className="border-b border-zinc-200/50 dark:border-zinc-700/50 py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100 text-left">
                Rewards
              </th>
              {nodeTypes.map((node) => (
                <th
                  key={node.id}
                  className={`border-b border-zinc-200/50 dark:border-zinc-700/50 py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100 text-center ${
                    node.isUnlocked ? 'bg-[#02abb8]/5 dark:bg-[#02abb8]/10' : ''
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-zinc-500 dark:text-zinc-400">{node.icon}</span>
                    <span>{node.name}</span>
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-normal">
                    {node.isUnlocked ? (
                      <span className="text-green-600 dark:text-green-400">Active</span>
                    ) : (
                      <span className="text-zinc-400">Inactive</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {benefitRows.map((row) => (
              <tr key={row.id} className="hover:bg-zinc-50/30 dark:hover:bg-zinc-800/30 transition-colors border-b border-zinc-100/50 dark:border-zinc-800/50 last:border-b-0">
                <td className="border-r border-zinc-200/50 dark:border-zinc-700/50 py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100 bg-zinc-50/20 dark:bg-zinc-900/20">
                  <RewardTooltip description={row.tooltip}>
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500 dark:text-zinc-400">{row.icon}</span>
                      <span>{row.label}</span>
                    </div>
                  </RewardTooltip>
                </td>
                {nodeTypes.map((node) => {
                  const value = getCellValue(node, row.id);
                  
                  return (
                    <td
                      key={node.id}
                      className={`border-r border-zinc-200/50 dark:border-zinc-700/50 py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100 text-center last:border-r-0 ${
                        node.isUnlocked ? 'bg-[#02abb8]/3 dark:bg-[#02abb8]/5' : ''
                      }`}
                    >
                      <span className={node.isUnlocked ? '' : 'text-zinc-400'}>
                        {value}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Action Buttons Section */}
      <div className="mt-6 p-4 bg-zinc-50/30 dark:bg-zinc-900/30 rounded-lg border border-zinc-200/50 dark:border-zinc-800/50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <button
            onClick={() => setShowNodeWizard(true)}
            className="px-4 py-2 w-auto max-w-[150px] bg-[#02abb8] hover:bg-[#028a94] text-white rounded-lg font-medium transition-colors text-sm"
          >
            Setup Node
          </button>
          <div className="text-sm text-zinc-600 dark:text-zinc-400 text-right">
            Connect your node to activate rewards. Visit the node setup page for more information.
          </div>
        </div>
      </div>

      {/* Node Setup Wizard */}
      {showNodeWizard && typeof window !== 'undefined' && createPortal(
        <NodeSetupWizard
          isOpen={showNodeWizard}
          onClose={() => setShowNodeWizard(false)}
        />,
        document.body
      )}
    </>
  );
}
