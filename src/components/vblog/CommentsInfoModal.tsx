'use client';

import { KxModalHeader, KxModalSectionTitle } from '@/components/payments/KxPaymentUi';

interface CommentsInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommentsInfoModal({ isOpen, onClose }: CommentsInfoModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
      <div
        role="presentation"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
        onMouseDown={onClose}
      />
      <div
        className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-xl max-w-xl w-full border border-zinc-200 dark:border-zinc-800 max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <KxModalHeader
          title="Comments System Information"
          subtitle="Costs, rewards, and how comments work on Kasparex"
          onClose={onClose}
        />

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <KxModalSectionTitle>Costs and rewards</KxModalSectionTitle>
            <div className="mt-2 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden text-sm">
              <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                <span>Action</span>
                <span>Cost</span>
                <span>Reward</span>
              </div>
              <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
                <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-4 py-3 text-zinc-700 dark:text-zinc-300">
                  <span>Purchase credits</span>
                  <span className="text-right tabular-nums text-zinc-900 dark:text-zinc-100">
                    10-100 KAS/KREX
                  </span>
                  <span className="text-zinc-500">-</span>
                </div>
                <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-4 py-3 text-zinc-700 dark:text-zinc-300">
                  <span>Submit comment</span>
                  <span className="text-right tabular-nums text-zinc-900 dark:text-zinc-100">1 credit</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">10 pts</span>
                </div>
                <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-4 py-3 text-zinc-700 dark:text-zinc-300">
                  <span>NFT holder discounts</span>
                  <span className="text-right text-zinc-900 dark:text-zinc-100">10-30% off</span>
                  <span className="text-zinc-500">-</span>
                </div>
                <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-4 py-3 text-zinc-700 dark:text-zinc-300">
                  <span>100M+ KREX holders</span>
                  <span className="text-right text-[#02abb8] font-semibold">Unlimited</span>
                  <span className="text-zinc-500">-</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/80 dark:bg-zinc-800/40 p-4">
            <KxModalSectionTitle>Payment</KxModalSectionTitle>
            <p className="kx-body mt-2 leading-relaxed">
              Comment credits can be purchased with KAS or KREX through the same L1 wallet flow used across
              Kasparex. Choose your preferred currency in the purchase modal before confirming.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/80 dark:bg-zinc-800/40 p-4">
            <KxModalSectionTitle>On-chain storage</KxModalSectionTitle>
            <p className="kx-body mt-2 leading-relaxed">
              Comments are stored and confirmed on the Kaspa BlockDAG, making them publicly verifiable. The
              credit-based system helps keep spam low and discussion quality high.
            </p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#02abb8] text-white font-medium text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
