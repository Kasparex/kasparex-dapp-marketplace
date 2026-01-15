'use client';

import { createPortal } from 'react-dom';

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
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Step 1: Choose Node Type</span>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Select between Light Node (lower resource requirements) or Mirror Node (higher rewards).
            </p>
          </div>
          <div className="border-l-2 border-[#02abb8] pl-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Step 2: Install & Configure</span>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Download and install the KREX Node software. Configure your node settings and connect to the Kasparex network.
            </p>
          </div>
          <div className="border-l-2 border-[#02abb8] pl-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Step 3: Connect & Verify</span>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Connect your node to your wallet and verify the connection. Your node status will appear in the dashboard.
            </p>
          </div>
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              For detailed setup instructions, visit the node setup documentation page.
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
