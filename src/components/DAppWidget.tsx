'use client';

import { useState, useEffect } from 'react';
import { DApp } from '@/lib/dapps';
import { NetworkCompatibilityModal } from './NetworkCompatibilityModal';
import { useNetworkCompatibility } from '@/hooks/useNetworkCompatibility';

interface DAppWidgetProps {
  dapp: DApp;
}

export function DAppWidget({ dapp }: DAppWidgetProps) {
  const [showModal, setShowModal] = useState(false);
  const compatibility = useNetworkCompatibility(dapp);

  const handleModalClose = () => {
    setShowModal(false);
  };

  const handleInteraction = () => {
    // Show modal only when user tries to interact with incompatible dApp
    if (!compatibility.isCompatible) {
      setShowModal(true);
    }
  };

  if (!dapp.widgetUrl) {
    return (
      <>
        <NetworkCompatibilityModal
          dapp={dapp}
          isOpen={showModal}
          onClose={handleModalClose}
        />
        
        <div 
          className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 cursor-pointer"
          onClick={handleInteraction}
        >
        <div className="text-center max-w-md">
          <svg
            className="mx-auto h-16 w-16 text-zinc-400 dark:text-zinc-600 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            Widget Coming Soon
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            The interactive widget for {dapp.name} will be available here once it&apos;s deployed.
          </p>
          {dapp.url && (
            <a
              href={dapp.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                if (!compatibility.isCompatible) {
                  e.preventDefault();
                  handleInteraction();
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
            >
              Launch App in New Tab
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          )}
        </div>
      </div>
      </>
    );
  }

  return (
    <>
      <NetworkCompatibilityModal
        dapp={dapp}
        isOpen={showModal}
        onClose={handleModalClose}
      />
      
      <div className="w-full">
          <div 
            className="relative w-full rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900" 
            style={{ minHeight: '600px' }}
            onClick={handleInteraction}
          >
            <iframe
              src={dapp.widgetUrl}
              className="w-full h-full border-0"
              style={{ minHeight: '600px', height: '100%' }}
              title={`${dapp.name} Widget`}
              allow="clipboard-read; clipboard-write"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            />
          </div>
        
        {/* Optional: Launch in new tab link */}
        {dapp.url && (
          <div className="mt-4 text-center">
            <a
              href={dapp.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              Open in new tab
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          </div>
        )}
      </div>
    </>
  );
}

