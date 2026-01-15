'use client';

import { createPortal } from 'react-dom';
import Link from 'next/link';

interface NodeSetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NodeSetupWizard({ isOpen, onClose }: NodeSetupWizardProps) {
  if (!isOpen) return null;

  return typeof window !== 'undefined' && createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      <div
        className="relative bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-zinc-200 dark:border-zinc-800"
        onClick={(e) => e.stopPropagation()}
      >
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
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div className="border-l-2 border-[#02abb8] pl-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center justify-center w-6 h-6 bg-[#02abb8] text-white text-xs font-bold rounded-full">1</span>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Choose Node Type</h3>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 ml-8">
              Select between Light Node (lower requirements, 4x multiplier) or Mirror Node (higher requirements, 5x multiplier).
            </p>
          </div>
          <div className="border-l-2 border-[#02abb8] pl-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center justify-center w-6 h-6 bg-[#02abb8] text-white text-xs font-bold rounded-full">2</span>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Install Node Software</h3>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 ml-8 mb-2">
              Download and install the Node software from the Kasparex repository.
            </p>
            <div className="ml-8 p-3 bg-zinc-50 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700">
              <code className="text-xs text-zinc-900 dark:text-zinc-100">
                git clone https://github.com/Kasparex/kasparex-grid-node.git
              </code>
            </div>
          </div>
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
          <div className="border-l-2 border-[#02abb8] pl-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center justify-center w-6 h-6 bg-[#02abb8] text-white text-xs font-bold rounded-full">4</span>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Connect to Kasparex Mesh</h3>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 ml-8">
              Register your KREX Node with the Kasparex API by providing your node&apos;s public address. Your node will be verified and rewards will be activated.
            </p>
          </div>
          <div className="border-l-2 border-[#02abb8] pl-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center justify-center w-6 h-6 bg-[#02abb8] text-white text-xs font-bold rounded-full">5</span>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Start Earning Rewards</h3>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 ml-8">
              Once connected and verified, you&apos;ll start earning boosted rewards on all dApp transactions.
            </p>
          </div>
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Link
              href="/api/krex-node"
              className="text-xs text-[#02abb8] hover:underline"
            >
              View full KREX Node documentation →
            </Link>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
