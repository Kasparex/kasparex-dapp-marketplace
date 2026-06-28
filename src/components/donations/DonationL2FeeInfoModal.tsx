'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { VDONATIONS_L2_FEE_PERCENT } from '@/lib/donations/config';

export function DonationL2FeeInfoModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors shrink-0"
        onClick={() => setOpen(true)}
        title="Where does the fee go?"
        aria-label="Where does the fee go?"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4" onClick={() => setOpen(false)}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
            <div
              className="relative bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-lg w-full border border-zinc-200 dark:border-zinc-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-5 py-4">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Where does the fee go?</h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-5 kx-body text-zinc-700 dark:text-zinc-300">
                <p>
                  {VDONATIONS_L2_FEE_PERCENT}% of your donation goes to the <strong>Kasparex Revenue Tree</strong> to support community rewards and the referral program. The rest
                  is escrowed for this campaign and goes to the creator when the goal is reached.
                </p>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
