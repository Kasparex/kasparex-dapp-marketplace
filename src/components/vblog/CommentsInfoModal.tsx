'use client';

interface CommentsInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommentsInfoModal({ isOpen, onClose }: CommentsInfoModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Comments System Information
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              Learn about costs, rewards, and how comments work
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Costs and Rewards Table */}
          <div className="mb-6">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
              Costs and Rewards
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800">
                    <th className="text-left py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">Action</th>
                    <th className="text-left py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">Cost</th>
                    <th className="text-left py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">Rewards</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800">
                    <td className="py-3 px-4 text-zinc-700 dark:text-zinc-300">Purchase Credits</td>
                    <td className="py-3 px-4 text-zinc-900 dark:text-zinc-100">10 KAS = 10 credits<br />25 KAS = 25 credits<br />50 KAS = 50 credits<br />100 KAS = 100 credits</td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">-</td>
                  </tr>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800">
                    <td className="py-3 px-4 text-zinc-700 dark:text-zinc-300">Submit Comment</td>
                    <td className="py-3 px-4 text-zinc-900 dark:text-zinc-100">1 credit</td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">10 points</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-zinc-700 dark:text-zinc-300">NFT Holder Discounts</td>
                    <td className="py-3 px-4 text-zinc-900 dark:text-zinc-100">Standard NFT: 10% off<br />Diamond NFT: 20% off<br />Rare NFT: 30% off</td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">-</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-zinc-700 dark:text-zinc-300">100M+ KREX Holders</td>
                    <td className="py-3 px-4 text-zinc-900 dark:text-zinc-100">Unlimited credits</td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* BlockDAG Storage Explanation */}
          <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              On-Chain Storage
            </h3>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-3">
              Comments are stored and confirmed on the Kaspa BlockDAG. This makes them more permanent and transparent, as all comments are publicly verifiable on-chain.
            </p>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              The credit-based system is designed to keep spam low and comment quality high, ensuring meaningful discussions and valuable contributions to the community.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#02abb8] hover:bg-[#028a94] text-white rounded-lg text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

