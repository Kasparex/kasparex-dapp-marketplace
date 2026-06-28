'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { DApp } from '@/lib/dapps';

interface DAppGuideModalProps {
  dapp: DApp;
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_GUIDE = `# How to Use This dApp

## Getting Started

1. **Connect Your Wallet**
   - Click the "Connect EVM Wallet" button in the widget header
   - Select your preferred wallet (MetaMask, WalletConnect, etc.)
   - Approve the connection request

2. **Check Network Compatibility**
   - Ensure your wallet is connected to the correct network
   - The widget will show the required network (Testnet/Mainnet)
   - Use the network switcher if needed

3. **Interact with the Widget**
   - Once connected, you can interact with the dApp features
   - Follow any on-screen instructions
   - Confirm transactions when prompted

## Tips

- Make sure you have sufficient balance for transaction fees
- Always verify transaction details before confirming
- Check the network status before making important transactions

## Need Help?

If you encounter any issues, check the dApp's additional information or contact the developer.`;

export function DAppGuideModal({ dapp, isOpen, onClose }: DAppGuideModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  // Use dApp's process field if available, otherwise use default guide
  const guideContent = dapp.process && dapp.process.trim().length > 0 
    ? dapp.process 
    : DEFAULT_GUIDE;

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-zinc-200 dark:border-zinc-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
          <div className="flex items-start justify-between mb-6">
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
              How to Use {dapp.name}
            </h2>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-6">
            <div className="prose prose-zinc dark:prose-invert max-w-none">
              <div className="kx-body text-zinc-700 dark:text-zinc-300 whitespace-pre-line">
                {guideContent}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-3 bg-[#02abb8] text-white rounded-lg hover:bg-[#0299a3] transition-colors font-medium text-base"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof window === 'undefined') {
    return null;
  }

  return createPortal(modalContent, document.body);
}

