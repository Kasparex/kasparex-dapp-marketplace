'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { formatLargeNumber } from '@/lib/rewards/calculator';

// Mock node status for simulation
const mockNodeStatus = {
  hasLightNode: false,
  hasMirrorNode: false,
  lightNodeConnected: false,
  mirrorNodeConnected: false,
  lightNodeUptime: 0,
  mirrorNodeUptime: 0,
};

// Node types configuration
const NODE_TYPES = {
  light: {
    name: 'KREX Node (Light)',
    multiplier: 1.2,
    feeReduction: 5,
    requirements: 'Run a KREX Light Node',
    rewards: '20% reward multiplier, 5% fee reduction',
  },
  mirror: {
    name: 'KREX Node (Mirror)',
    multiplier: 1.5,
    feeReduction: 10,
    requirements: 'Run a KREX Mirror Node',
    rewards: '50% reward multiplier, 10% fee reduction',
  },
};

export function NODEStatusBox() {
  const { isConnected: walletConnected } = useAccount();
  const hasAnyNode = mockNodeStatus.hasLightNode || mockNodeStatus.hasMirrorNode;
  const [showModal, setShowModal] = useState(false);
  const [showWizard, setShowWizard] = useState(false);

  const activeNodeType = mockNodeStatus.hasMirrorNode ? 'mirror' : mockNodeStatus.hasLightNode ? 'light' : null;
  const nodeConfig = activeNodeType ? NODE_TYPES[activeNodeType] : null;
  const nodeConnected = activeNodeType 
    ? (activeNodeType === 'mirror' ? mockNodeStatus.mirrorNodeConnected : mockNodeStatus.lightNodeConnected)
    : false;

  return (
    <>
      <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            KREX Node Status
          </h3>
          <div className="flex items-center gap-2">
            {hasAnyNode && nodeConnected && (
              <span className="text-xs px-2 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full">
                Active
              </span>
            )}
            {hasAnyNode && !nodeConnected && (
              <span className="text-xs px-2 py-1 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded-full">
                Disconnected
              </span>
            )}
            <button
              className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
              onClick={() => setShowModal(true)}
              aria-label="View node requirements"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {hasAnyNode && nodeConfig ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-600 dark:text-zinc-400">
                  Node Type
                </span>
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {nodeConfig.name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-600 dark:text-zinc-400">
                  Multiplier
                </span>
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {nodeConfig.multiplier}x
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-600 dark:text-zinc-400">
                  Fee Reduction
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {nodeConfig.feeReduction}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-600 dark:text-zinc-400">
                  Status
                </span>
                <span className={`text-xs font-medium ${
                  nodeConnected 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-yellow-600 dark:text-yellow-400'
                }`}>
                  {nodeConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </>
          ) : (
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              No active node
            </div>
          )}
          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700">
            <button
              onClick={() => setShowWizard(true)}
              className="block w-full mt-2 px-3 py-2 text-xs font-medium text-center bg-[#02abb8] hover:bg-[#028a94] text-white rounded-lg transition-colors"
            >
              Setup Node
            </button>
          </div>
        </div>
      </div>

      {/* NODE Requirements Modal */}
      {showModal && typeof window !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
          
          {/* Modal Content */}
          <div
            className="relative bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-zinc-200 dark:border-zinc-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  KREX Node Requirements
                </h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                  Run a KREX Node to unlock additional rewards and support the Kasparex Mesh
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Table */}
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-700">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">KREX Node Type</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Requirements</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Reward Multiplier</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Fee Reduction</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Rewards</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(NODE_TYPES).map(([key, node]) => {
                      const isUserNode = activeNodeType === key;
                      return (
                        <tr
                          key={key}
                          className={`border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${
                            isUserNode ? 'bg-[#02abb8]/10 dark:bg-[#02abb8]/20' : ''
                          }`}
                        >
                          <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100 font-medium">
                            {node.name}
                            {isUserNode && (
                              <span className="ml-2 text-xs text-[#02abb8] font-medium">(Active)</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm text-zinc-600 dark:text-zinc-400">
                            {node.requirements}
                          </td>
                          <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100">
                            {node.multiplier}x
                          </td>
                          <td className="py-3 px-4 text-sm text-zinc-600 dark:text-zinc-400">
                            {node.feeReduction}%
                          </td>
                          <td className="py-3 px-4 text-sm text-zinc-600 dark:text-zinc-400">
                            {node.rewards}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Setup Node Button */}
              <div className="mt-6">
                <button
                  className="w-full px-6 py-2 bg-[#02abb8] hover:bg-[#028a94] text-white rounded-lg font-medium transition-colors"
                  onClick={() => {
                    setShowModal(false);
                    setShowWizard(true);
                  }}
                >
                  Setup Node
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Node Setup Wizard */}
      {showWizard && typeof window !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
          onClick={() => setShowWizard(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
          
          {/* Modal Content */}
          <div
            className="relative bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-zinc-200 dark:border-zinc-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  KREX Node Setup Wizard
                </h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                  Follow these steps to set up your KREX Node and join the Kasparex Mesh
                </p>
              </div>
              <button
                onClick={() => setShowWizard(false)}
                className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Wizard Content */}
            <div className="p-6 space-y-6">
              {/* Step 1 */}
              <div className="border-l-2 border-[#02abb8] pl-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex items-center justify-center w-6 h-6 bg-[#02abb8] text-white text-xs font-bold rounded-full">1</span>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Choose KREX Node Type</h3>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 ml-8">
                  Select between KREX Light Node (lower requirements, 20% multiplier) or KREX Mirror Node (higher requirements, 50% multiplier).
                </p>
              </div>

              {/* Step 2 */}
              <div className="border-l-2 border-[#02abb8] pl-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex items-center justify-center w-6 h-6 bg-[#02abb8] text-white text-xs font-bold rounded-full">2</span>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Install KREX Node Software</h3>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 ml-8 mb-2">
                  Download and install the KREX Node software from the Kasparex repository.
                </p>
                <div className="ml-8 p-3 bg-zinc-50 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700">
                  <code className="text-xs text-zinc-900 dark:text-zinc-100">
                    git clone https://github.com/Kasparex/kasparex-grid-node.git
                  </code>
                </div>
              </div>

              {/* Step 3 */}
              <div className="border-l-2 border-[#02abb8] pl-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex items-center justify-center w-6 h-6 bg-[#02abb8] text-white text-xs font-bold rounded-full">3</span>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Configure Your KREX Node</h3>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 ml-8 mb-2">
                  Configure your KREX Node settings and ensure it&apos;s connected to the Kasparex Mesh API.
                </p>
                <div className="ml-8 p-3 bg-zinc-50 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700">
                  <code className="text-xs text-zinc-900 dark:text-zinc-100">
                    npm install && npm start
                  </code>
                </div>
              </div>

              {/* Step 4 */}
              <div className="border-l-2 border-[#02abb8] pl-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex items-center justify-center w-6 h-6 bg-[#02abb8] text-white text-xs font-bold rounded-full">4</span>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Connect to Kasparex Mesh</h3>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 ml-8">
                  Register your KREX Node with the Kasparex Mesh API by providing your node&apos;s public address. Your node will be verified and rewards will be activated.
                </p>
              </div>

              {/* Step 5 */}
              <div className="border-l-2 border-[#02abb8] pl-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex items-center justify-center w-6 h-6 bg-[#02abb8] text-white text-xs font-bold rounded-full">5</span>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Start Earning Rewards</h3>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 ml-8">
                  Once connected and verified, you&apos;ll start earning boosted rewards on all dApp transactions.
                </p>
              </div>

              {/* Documentation Link */}
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <Link
                  href="/mesh/krex-node"
                  className="text-xs text-[#02abb8] hover:underline"
                >
                  View full KREX Node documentation →
                </Link>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

